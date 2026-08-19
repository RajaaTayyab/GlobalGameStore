import { requireAdmin, authError } from "@/lib/auth";
import { requireAdminClient } from "@/lib/supabase/admin";
import { sendOrderCodesEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * Admin delivers codes for an order (used for WhatsApp orders where
 * the customer paid outside the system). Optionally emails them.
 */
export async function POST(req: Request, ctx: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await ctx.params;
    const admin = requireAdminClient();
    const body = await req.json();

    const { data: order } = await admin
      .from("orders")
      .select("*")
      .eq("id", id)
      .single();
    if (!order) return Response.json({ error: "Order not found" }, { status: 404 });

    const rawCodes: { productName: string; variantName: string; code: string }[] =
      Array.isArray(body.codes) ? body.codes : [];

    if (rawCodes.length > 0) {
      const cleaned = rawCodes.filter((c) => c.code?.trim());
      if (cleaned.length > 0) {
        const deliveredCodes = cleaned.map((c) => c.code.trim());

        // A code already sold/assigned in our inventory can never be reused.
        const { data: usedRows } = await admin
          .from("codes")
          .select("code")
          .in("code", deliveredCodes)
          .eq("status", "assigned");
        const used = (usedRows ?? []).map((r) => r.code);
        if (used.length > 0) {
          return Response.json(
            {
              error: `These codes were already sold and cannot be reused: ${[...new Set(used)].join(", ")}`,
            },
            { status: 409 }
          );
        }

        const { error } = await admin.from("order_codes").insert(
          cleaned.map((c) => ({
            order_id: id,
            product_name: c.productName || order.customer_name || "Game",
            variant_name: c.variantName || "Code",
            code: c.code.trim(),
          }))
        );
        if (error) throw error;

        // Persist the sale: mark matching inventory codes as assigned so the
        // storefront stock count drops and they can't be delivered again.
        await admin
          .from("codes")
          .update({ status: "assigned", order_id: id })
          .in("code", deliveredCodes)
          .eq("status", "available");
      }
    }

    await admin.from("orders").update({ status: "completed" }).eq("id", id);

    // Email codes if requested and we have an email + codes
    let emailSent = false;
    if (body.email && (order.customer_email || body.email)) {
      const { data: orderCodes } = await admin
        .from("order_codes")
        .select("*")
        .eq("order_id", id);

      if (orderCodes && orderCodes.length > 0) {
        const byLine = new Map<string, string[]>();
        for (const oc of orderCodes) {
          const key = `${oc.product_name} ${oc.variant_name}`;
          byLine.set(key, [...(byLine.get(key) ?? []), oc.code]);
        }
        const res = await sendOrderCodesEmail({
          to: body.email || order.customer_email!,
          customerName: order.customer_name || "",
          orderNumber: order.order_number,
          total: Number(order.total),
          lines: Array.from(byLine.entries()).map(([name, codes]) => ({
            productName: name.split(" ")[0],
            variantName: name.split(" ").slice(1).join(" "),
            quantity: codes.length,
            codes,
          })),
        });
        emailSent = res.sent;
      }
    }

    return Response.json({ ok: true, email_sent: emailSent });
  } catch (e) {
    return authError(e);
  }
}
