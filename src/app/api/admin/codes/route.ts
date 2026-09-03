import { requireAdmin, authError } from "@/lib/auth";
import { requireAdminClient } from "@/lib/supabase/admin";
import { revalidateTag } from "next/cache";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const admin = requireAdminClient();
    const url = new URL(req.url);
    const variantId = url.searchParams.get("variant_id");
    if (!variantId) {
      return Response.json({ error: "variant_id is required" }, { status: 400 });
    }
    // `codes` has no FK to `orders` in the schema, so PostgREST can't
    // resolve `order:orders(...)` here. Flat select on codes, then resolve
    // the order number by joining order_codes → orders on the code string
    // (order_codes stores the code as text, so this join is safe).
    const { data: codes, error: cErr } = await admin
      .from("codes")
      .select("id, code, status, created_at, order_id")
      .eq("variant_id", variantId)
      .order("created_at", { ascending: false })
      .limit(500);
    if (cErr) {
      console.error("variant codes list error:", cErr);
      return Response.json(
        { error: `Could not load codes: ${cErr.message}` },
        { status: 500 }
      );
    }

    const soldCodes = (codes ?? []).filter((c) => c.status === "assigned");
    const orderMap = new Map<string, string>();
    if (soldCodes.length > 0) {
      const codeStrs = soldCodes.map((c) => c.code);
      const { data: ocRows, error: ocErr } = await admin
        .from("order_codes")
        .select("code, order:orders(order_number)")
        .in("code", codeStrs);
      if (ocErr) {
        console.error("variant codes order_codes lookup error:", ocErr);
        // Non-fatal: still return the code list, just without order numbers.
      } else {
        for (const r of ocRows ?? []) {
          const orderRaw = r.order as unknown;
          const order = Array.isArray(orderRaw) ? orderRaw[0] : orderRaw;
          const num = (order as { order_number?: string } | null)?.order_number;
          if (num && !orderMap.has(r.code)) orderMap.set(r.code, num);
        }
      }
    }

    const rows = (codes ?? []).map((c) => ({
      id: c.id,
      code: c.code,
      status: c.status,
      created_at: c.created_at,
      order_id: c.order_id,
      order: c.status === "assigned" && orderMap.has(c.code)
        ? { order_number: orderMap.get(c.code)! }
        : null,
    }));
    return Response.json({ codes: rows });
  } catch (e) {
    console.error("variant codes list error:", e);
    if (e instanceof Error) {
      return Response.json(
        { error: `Could not load codes: ${e.message}` },
        { status: 500 }
      );
    }
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const admin = requireAdminClient();
    const body = await req.json();

    if (!body.variant_id) {
      return Response.json({ error: "variant_id is required" }, { status: 400 });
    }
    const rawCodes: string[] = Array.isArray(body.codes)
      ? body.codes
      : String(body.codes ?? "")
          .split(/[\n,]+/)
          .map((c: string) => c.trim());

    const codes = rawCodes.filter(Boolean);

    if (codes.length === 0) {
      return Response.json({ added: 0, purchased: { count: 0, codes: [] }, already_in_use: { count: 0, codes: [] } });
    }

    // Reject any that already exist (duplicate codes can never be used
    // again) — guarded at the DB level too by idx_codes_code_unique.
    // We fetch the status so we can tell the admin apart "already in our
    // inventory" from "already sold to a customer".
    const { data: existing } = await admin
      .from("codes")
      .select("code, status")
      .in("code", codes);
    const statusByCode = new Map<string, string>();
    for (const r of existing ?? []) statusByCode.set(r.code, r.status);

    const seen = new Set<string>();
    const fresh: string[] = [];
    const purchased: string[] = [];
    const alreadyInUse: string[] = [];
    for (const c of codes) {
      if (seen.has(c) || statusByCode.has(c)) {
        if (statusByCode.get(c) === "assigned") purchased.push(c);
        else alreadyInUse.push(c);
        seen.add(c);
        continue;
      }
      seen.add(c);
      fresh.push(c);
    }

    if (fresh.length === 0) {
      return Response.json({
        added: 0,
        purchased: { count: purchased.length, codes: purchased },
        already_in_use: { count: alreadyInUse.length, codes: alreadyInUse },
      });
    }

    const { data, error } = await admin
      .from("codes")
      .insert(fresh.map((code) => ({ variant_id: body.variant_id, code })))
      .select();
    if (error) {
      // Race with another admin: the unique index rejected a code we thought
      // was fresh. Re-check and surface a clean categorized response instead
      // of a generic 500.
      if ((error as { code?: string }).code === "23505") {
        const { data: recheck } = await admin
          .from("codes")
          .select("code, status")
          .in("code", fresh);
        for (const r of recheck ?? []) {
          purchased.push(r.code);
        }
        const { count: addedCount } = await admin
          .from("codes")
          .select("*", { count: "exact", head: true })
          .eq("variant_id", body.variant_id)
          .in("code", fresh);
        return Response.json({
          added: addedCount ?? 0,
          purchased: { count: purchased.length, codes: purchased },
          already_in_use: { count: alreadyInUse.length, codes: alreadyInUse },
        });
      }
      throw error;
    }
    revalidateTag("catalog", { expire: 0 });
    revalidateTag("stock", { expire: 0 });
    return Response.json({
      added: data.length,
      purchased: { count: purchased.length, codes: purchased },
      already_in_use: { count: alreadyInUse.length, codes: alreadyInUse },
    });
  } catch (e) {
    return authError(e);
  }
}
