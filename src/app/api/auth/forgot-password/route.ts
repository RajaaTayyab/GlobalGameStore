import { createClient } from "@/lib/supabase/server";
import { clientIp, rateLimit } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { email } = await req.json();
  if (!email) {
    return Response.json({ error: "Email is required" }, { status: 400 });
  }

  const ip = clientIp(req);
  const rl = await rateLimit(`forgot:${ip}:${String(email).toLowerCase()}`, 5, 900);
  if (!rl.allowed) {
    return Response.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  }

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ??
    req.headers.get("origin") ??
    "http://localhost:3000";

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  // Always return success so we don't leak which emails exist.
  return Response.json({ ok: true });
}
