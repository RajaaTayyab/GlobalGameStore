import { createClient } from "@/lib/supabase/server";
import { requireAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const rl = await rateLimit(`delete:${user.id}`, 3, 3600);  if (!rl.allowed) {
    return Response.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429 }
    );
  }

  // Deleting the auth user cascades to profiles and credit_transactions.
  const admin = requireAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  await supabase.auth.signOut();
  return Response.json({ ok: true });
}
