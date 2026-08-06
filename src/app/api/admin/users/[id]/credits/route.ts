import { requireAdmin, authError } from "@/lib/auth";
import { requireAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** Admin adds (or removes, with negative amount) credits for a user. */
export async function POST(req: Request, ctx: RouteContext) {
  try {
    const adminProfile = await requireAdmin();
    const { id } = await ctx.params;
    const admin = requireAdminClient();
    const body = await req.json();

    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount === 0) {
      return Response.json({ error: "Amount must be a non-zero number" }, { status: 400 });
    }

    const { data: user } = await admin
      .from("profiles")
      .select("id, credits_balance")
      .eq("id", id)
      .single();
    if (!user) return Response.json({ error: "User not found" }, { status: 404 });

    const newBalance = Math.max(0, Number(user.credits_balance) + amount);

    const { data: updated } = await admin
      .from("profiles")
      .update({ credits_balance: newBalance })
      .eq("id", id)
      .select()
      .single();

    await admin.from("credit_transactions").insert({
      user_id: id,
      admin_id: adminProfile.id,
      amount,
      reason: typeof body.reason === "string" && body.reason.trim()
        ? body.reason.trim()
        : amount > 0
          ? "Credits added by admin"
          : "Credits deducted by admin",
    });

    return Response.json({ profile: updated });
  } catch (e) {
    return authError(e);
  }
}
