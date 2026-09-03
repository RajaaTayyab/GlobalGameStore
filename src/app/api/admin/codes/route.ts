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
    // Pull codes + the order they're tied to (sold codes carry an order_id).
    // Left-joining orders so 'available' codes still come back with order=null.
    const { data, error } = await admin
      .from("codes")
      .select("id, code, status, created_at, order_id, order:orders(order_number)")
      .eq("variant_id", variantId)
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw error;
    return Response.json({ codes: data ?? [] });
  } catch (e) {
    return authError(e);
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
