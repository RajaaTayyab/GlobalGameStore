import { authError } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const password = typeof body.password === "string" ? body.password : "";
    const confirm = typeof body.confirm === "string" ? body.confirm : "";

    if (password.length < 6) {
      return Response.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }
    if (password !== confirm) {
      return Response.json({ error: "Passwords do not match" }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;

    return Response.json({ ok: true });
  } catch (e) {
    return authError(e);
  }
}
