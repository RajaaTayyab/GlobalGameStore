import { requireAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { clientIp, rateLimit } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { name, email, password } = await req.json();

  if (!email || !password) {
    return Response.json({ error: "Name, email and password are required" }, { status: 400 });
  }
  if (password.length < 6) {
    return Response.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  const ip = clientIp(req);
  const rl = await rateLimit(`register:${ip}`, 5, 3600);
  if (!rl.allowed) {
    return Response.json(
      { error: "Too many sign-ups from this address. Please try again later." },
      { status: 429 }
    );
  }

  const requireConfirmation = process.env.REQUIRE_EMAIL_VERIFICATION === "true";

  const admin = requireAdminClient();
  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: !requireConfirmation,
    user_metadata: { full_name: name ?? "" },
  });

  if (error || !created.user) {
    return Response.json({ error: error?.message ?? "Could not create account" }, { status: 400 });
  }

  // Auto-promote emails listed in ADMIN_EMAILS
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (adminEmails.includes(email.toLowerCase())) {
    await admin
      .from("profiles")
      .update({ role: "admin", full_name: name ?? null })
      .eq("id", created.user.id);
  }

  // With email verification enabled, don't auto-login; the user must confirm first.
  if (requireConfirmation) {
    return Response.json({ user: created.user, requires_confirmation: true });
  }

  // Create session cookies for the new user
  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError) {
    return Response.json({ error: signInError.message }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", created.user.id)
    .maybeSingle();

  return Response.json({ user: created.user, profile });
}
