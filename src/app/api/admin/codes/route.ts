import { requireAdmin, authError } from "@/lib/auth";
import { requireAdminClient } from "@/lib/supabase/admin";
import { revalidateTag } from "next/cache";

export const dynamic = "force-dynamic";

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

    const codes = rawCodes
      .filter(Boolean)
      .map((code) => ({ variant_id: body.variant_id, code }));

    if (codes.length === 0) {
      return Response.json({ error: "No codes provided" }, { status: 400 });
    }

    const { data, error } = await admin.from("codes").insert(codes).select();
    if (error) throw error;
    revalidateTag("catalog", { expire: 0 });
    revalidateTag("stock", { expire: 0 });
    return Response.json({ added: data.length });
  } catch (e) {
    return authError(e);
  }
}
