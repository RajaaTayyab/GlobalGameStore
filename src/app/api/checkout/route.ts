import { requireAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { generateOrderNumber, buildWhatsAppLink, buildWhatsAppOrderMessage } from "@/lib/order";
import { sendOrderCodesEmail } from "@/lib/email";
import { STORE_NAME } from "@/lib/constants";
import type { CartItem } from "@/lib/types";

export const dynamic = "force-dynamic";

interface CheckoutBody {
  items: { variantId: string; quantity: number }[];
  paymentMethod: "credits" | "whatsapp";
  customer: { name: string; email: string; whatsapp: string; country?: string };
}

export async function POST(req: Request) {
  const body: CheckoutBody = await req.json().catch(() => null);
  if (!body || !Array.isArray(body.items) || body.items.length === 0) {
    return Response.json({ error: "Cart is empty" }, { status: 400 });
  }
  const method = body.paymentMethod === "credits" ? "credits" : "whatsapp";
  const c = body.customer ?? {};

  const admin = requireAdminClient();

  // ---- Validate variants & compute total ----
  const variantIds = body.items.map((i) => i.variantId);
  const { data: variants, error: vErr } = await admin
    .from("product_variants")
    .select("*, product:products(id, name, slug, image_url, active, sold_out)")
    .in("id", variantIds)
    .eq("active", true);

  if (vErr || !variants || variants.length !== variantIds.length) {
    return Response.json({ error: "One or more items are no longer available" }, { status: 400 });
  }

  const soldOut = (variants as unknown as { product: { sold_out?: boolean } }[]).some(
    (v) => v.product?.sold_out
  );
  if (soldOut) {
    return Response.json(
      { error: "One or more items are sold out and cannot be ordered" },
      { status: 400 }
    );
  }

  const items: CartItem[] = body.items.map((raw) => {
    const v = variants.find((x) => x.id === raw.variantId)!;
    const product = (v as unknown as {
      product: { id: string; name: string; slug: string; image_url: string | null };
    }).product;
    return {
      variantId: v.id,
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      productImage: product.image_url,
      variantName: v.name,
      unitPrice: Number(v.price),
      quantity: Math.max(1, Math.min(99, Math.floor(raw.quantity))),
    };
  });

  const total = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

  // ---- Order number (unique-ish) ----
  let orderNumber = generateOrderNumber();
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: existing } = await admin
      .from("orders")
      .select("id")
      .eq("order_number", orderNumber)
      .maybeSingle();
    if (!existing) break;
    orderNumber = generateOrderNumber();
  }

  // ================= WHATSAPP ORDER =================
  if (method === "whatsapp") {
    const { data: settings } = await admin
      .from("settings")
      .select("value")
      .eq("key", "whatsapp_number")
      .maybeSingle();
    const storePhone =
      (settings?.value as string) || process.env.WHATSAPP_NUMBER || "15551234567";

    const message = buildWhatsAppOrderMessage({
      orderNumber,
      items,
      total,
      customerName: c.name || "Guest",
      customerEmail: c.email || "",
      customerWhatsapp: c.whatsapp || "",
      country: c.country,
    });
    const whatsappLink = buildWhatsAppLink(storePhone, message);

    const { data: order, error: orderErr } = await admin
      .from("orders")
      .insert({
        order_number: orderNumber,
        customer_name: c.name || null,
        customer_email: c.email || null,
        customer_whatsapp: c.whatsapp || null,
        country: c.country || null,
        total,
        payment_method: "whatsapp",
        status: "pending",
        whatsapp_link: whatsappLink,
      })
      .select()
      .single();

    if (orderErr || !order) {
      console.error("checkout whatsapp order error:", orderErr);
      return Response.json({ error: "Could not create order" }, { status: 500 });
    }

    await admin.from("order_items").insert(
      items.map((i) => ({
        order_id: order.id,
        product_id: i.productId,
        product_name: i.productName,
        variant_id: i.variantId,
        variant_name: i.variantName,
        quantity: i.quantity,
        unit_price: i.unitPrice,
        total: i.unitPrice * i.quantity,
      }))
    );

    return Response.json({
      ok: true,
      order: {
        id: order.id,
        order_number: order.order_number,
        payment_method: "whatsapp",
        status: order.status,
        whatsapp_link: whatsappLink,
      },
    });
  }

  // ================= CREDITS ORDER =================
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Please log in to pay with credits" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const balance = Number(profile?.credits_balance ?? 0);
  if (balance < total) {
    return Response.json(
      { error: `Insufficient credits. Balance: $${balance.toFixed(2)}, total: $${total.toFixed(2)}` },
      { status: 400 }
    );
  }

  const { data: order, error: orderErr } = await admin
    .from("orders")
    .insert({
      order_number: orderNumber,
      user_id: user.id,
      customer_name: c.name || profile?.full_name || null,
      customer_email: c.email || user.email || null,
      customer_whatsapp: c.whatsapp || null,
      country: c.country || null,
      total,
      payment_method: "credits",
      status: "paid",
    })
    .select()
    .single();

  if (orderErr || !order) {
    console.error("checkout credits order error:", orderErr);
    return Response.json({ error: "Could not create order" }, { status: 500 });
  }

  const { data: orderItems } = await admin
    .from("order_items")
    .insert(
      items.map((i) => ({
        order_id: order.id,
        product_id: i.productId,
        product_name: i.productName,
        variant_id: i.variantId,
        variant_name: i.variantName,
        quantity: i.quantity,
        unit_price: i.unitPrice,
        total: i.unitPrice * i.quantity,
      }))
    )
    .select();

  // ---- Assign codes from stock ----
  const lines: { productName: string; variantName: string; quantity: number; codes: string[] }[] =
    [];
  let delivered = 0;

  for (const item of items) {
    const { data: available } = await admin
      .from("codes")
      .select("id, code")
      .eq("variant_id", item.variantId)
      .eq("status", "available")
      .limit(item.quantity);

    const picked = (available ?? []).slice(0, item.quantity);
    const codes = picked.map((p) => p.code);

    if (picked.length > 0) {
      await admin
        .from("codes")
        .update({ status: "assigned", order_id: order.id })
        .in(
          "id",
          picked.map((p) => p.id)
        );
      await admin.from("order_codes").insert(
        codes.map((code) => ({
          order_id: order.id,
          order_item_id:
            orderItems?.find(
              (oi) => oi.variant_id === item.variantId && oi.product_name === item.productName
            )?.id ?? null,
          product_name: item.productName,
          variant_name: item.variantName,
          code,
        }))
      );
    }

    delivered += codes.length;
    lines.push({
      productName: item.productName,
      variantName: item.variantName,
      quantity: item.quantity,
      codes,
    });
  }

  // ---- Deduct credits & log transaction ----
  await admin
    .from("profiles")
    .update({ credits_balance: balance - total })
    .eq("id", user.id);
  await admin.from("credit_transactions").insert({
    user_id: user.id,
    amount: -total,
    reason: `Order #${orderNumber} - ${STORE_NAME}`,
    order_id: order.id,
  });

  // ---- Email codes ----
  let emailSent = false;
  if (c.email || user.email) {
    try {
      const res = await sendOrderCodesEmail({
        to: c.email || user.email!,
        customerName: c.name || profile?.full_name || "",
        orderNumber,
        total,
        lines,
      });
      emailSent = res.sent;
    } catch (e) {
      console.error("email send failed:", e);
    }
  }

  // Mark completed when every item had codes delivered
  const allDelivered =
    lines.every((l) => l.codes.length >= l.quantity) && items.length > 0;
  if (allDelivered) {
    await admin.from("orders").update({ status: "completed" }).eq("id", order.id);
  }

  return Response.json({
    ok: true,
    order: {
      id: order.id,
      order_number: order.order_number,
      payment_method: "credits",
      status: allDelivered ? "completed" : "paid",
      codes_delivered: delivered,
      email_sent: emailSent,
    },
  });
}
