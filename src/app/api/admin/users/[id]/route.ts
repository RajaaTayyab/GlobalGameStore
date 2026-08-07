import { requireAdmin, authError } from "@/lib/auth";
import { requireAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    if (!id) {
      return Response.json({ error: "User id is required" }, { status: 400 });
    }

    const admin = requireAdminClient();
    // Deleting the auth user cascades to profiles and credit_transactions.
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ ok: true });
  } catch (e) {
    return authError(e);
  }
}
