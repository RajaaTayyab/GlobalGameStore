import { requireAdmin, authError } from "@/lib/auth";
import { requireAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
    const admin = requireAdminClient();

    const { data: users } = await admin
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    // Per-user credit history
    const { data: transactions } = await admin
      .from("credit_transactions")
      .select("*")
      .order("created_at", { ascending: false });

    return Response.json({ users, transactions });
  } catch (e) {
    return authError(e);
  }
}
