import { requireProfile, authError } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function PUT(req: Request) {
  try {
    const profile = await requireProfile();
    const body = await req.json();

    const allowed: Record<string, string> = {};
    if (typeof body.full_name === "string") allowed.full_name = body.full_name;
    if (typeof body.phone === "string") allowed.phone = body.phone;
    if (typeof body.whatsapp === "string") allowed.whatsapp = body.whatsapp;
    if (typeof body.country === "string") allowed.country = body.country;

    if (Object.keys(allowed).length === 0) {
      return Response.json({ error: "Nothing to update" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      .update(allowed)
      .eq("id", profile.id)
      .select()
      .single();

    if (error) throw error;
    return Response.json({ profile: data });
  } catch (e) {
    return authError(e);
  }
}
