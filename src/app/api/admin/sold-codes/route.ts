import { requireAdmin } from "@/lib/auth";
import { requireAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Lists every sold code (status = 'assigned') across the store, newest first,
 * with the order it was sold on and the buyer. Used by the admin
 * "Sold Codes" tab so you can audit and clean up test/purchased records.
 *
 * Schema note: `codes` has no FK to `orders` in this DB, so we bridge
 * through `order_codes` (which DOES have an FK to `orders` and stores
 * the code string). Three flat queries, no risky embeds.
 */
export async function GET() {
  try {
    await requireAdmin();
    const admin = requireAdminClient();

    const { data: codeRows, error: cErr } = await admin
      .from("codes")
      .select("id, code, status, created_at, order_id, variant_id")
      .eq("status", "assigned")
      .order("created_at", { ascending: false })
      .limit(500);
    if (cErr) {
      console.error("sold-codes codes error:", cErr);
      return Response.json(
        { error: `Could not load sold codes: ${cErr.message}` },
        { status: 500 }
      );
    }

    const codeStrs = (codeRows ?? []).map((c) => c.code);

    let orderByCode = new Map<
      string,
      {
        order_number: string;
        customer_email: string | null;
        customer_name: string | null;
        created_at: string;
      }
    >();
    if (codeStrs.length > 0) {
      const { data: ocRows, error: ocErr } = await admin
        .from("order_codes")
        .select("code, order:orders(order_number, customer_email, customer_name, created_at)")
        .in("code", codeStrs);
      if (ocErr) {
        console.error("sold-codes order_codes error:", ocErr);
        return Response.json(
          { error: `Could not load sold codes: ${ocErr.message}` },
          { status: 500 }
        );
      }
      for (const r of ocRows ?? []) {
        const orderRaw = r.order as unknown;
        const order = Array.isArray(orderRaw) ? orderRaw[0] : orderRaw;
        const o = order as {
          order_number?: string;
          customer_email?: string | null;
          customer_name?: string | null;
          created_at?: string;
        } | null;
        if (!o?.order_number) continue;
        // First row wins per code; duplicates are harmless for display.
        if (!orderByCode.has(r.code)) {
          orderByCode.set(r.code, {
            order_number: o.order_number,
            customer_email: o.customer_email ?? null,
            customer_name: o.customer_name ?? null,
            created_at: o.created_at ?? "",
          });
        }
      }
    }

    const variantIds = Array.from(
      new Set((codeRows ?? []).map((r) => r.variant_id).filter(Boolean))
    );

    let variantMap = new Map<
      string,
      { name: string; product: { id: string; name: string; slug: string; image_url: string | null } | null }
    >();
    if (variantIds.length > 0) {
      const { data: variants, error: vErr } = await admin
        .from("product_variants")
        .select("id, name, product:products(id, name, slug, image_url)")
        .in("id", variantIds);
      if (vErr) {
        console.error("sold-codes variants error:", vErr);
        return Response.json(
          { error: `Could not load sold codes: ${vErr.message}` },
          { status: 500 }
        );
      }
      for (const v of variants ?? []) {
        const productRaw = v.product as unknown;
        const product = Array.isArray(productRaw) ? productRaw[0] : productRaw;
        variantMap.set(v.id, {
          name: v.name,
          product:
            (product as { id: string; name: string; slug: string; image_url: string | null } | null) ??
            null,
        });
      }
    }

    const codes = (codeRows ?? []).map((r) => ({
      id: r.id,
      code: r.code,
      status: r.status,
      created_at: r.created_at,
      order_id: r.order_id,
      variant: r.variant_id ? variantMap.get(r.variant_id) ?? null : null,
      order: orderByCode.get(r.code) ?? null,
    }));

    return Response.json({ codes });
  } catch (e) {
    console.error("sold-codes list error:", e);
    if (e instanceof Error) {
      return Response.json(
        { error: `Could not load sold codes: ${e.message}` },
        { status: 500 }
      );
    }
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
