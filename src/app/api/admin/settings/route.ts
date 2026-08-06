import { requireAdmin, authError } from "@/lib/auth";
import { requireAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
    const admin = requireAdminClient();
    const { data } = await admin.from("settings").select("*");
    const map: Record<string, string> = {};
    for (const s of data ?? []) map[s.key] = s.value;
    return Response.json({ settings: map });
  } catch (e) {
    return authError(e);
  }
}

export async function PUT(req: Request) {
  try {
    await requireAdmin();
    const admin = requireAdminClient();
    const body = await req.json();

    const allowed = ["whatsapp_number", "store_name"];
    const rows = Object.entries(body ?? {})
      .filter(([k]) => allowed.includes(k) && typeof body[k] === "string")
      .map(([key, value]) => ({ key, value: value as string }));

    if (rows.length > 0) {
      await admin.from("settings").upsert(rows);
    }
    return Response.json({ ok: true });
  } catch (e) {
    return authError(e);
  }
}
