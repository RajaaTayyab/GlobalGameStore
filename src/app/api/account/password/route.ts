import { authError } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
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
    if (!currentPassword) {
      return Response.json({ error: "Please enter your current password" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const rl = await rateLimit(`password:${user.id}`, 5, 900);
    if (!rl.allowed) {
      return Response.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429 }
      );
    }

    // Verify the current password before allowing a change (S4).
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });
    if (verifyError) {
      return Response.json({ error: "Current password is incorrect" }, { status: 400 });
    }

    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;

    return Response.json({ ok: true });
  } catch (e) {
    return authError(e);
  }
}
