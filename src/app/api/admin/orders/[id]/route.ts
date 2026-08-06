import { requireAdmin, authError } from "@/lib/auth";
import { requireAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: Request, ctx: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await ctx.params;
    const admin = requireAdminClient();
    const body = await req.json();

    if (!["pending", "paid", "completed", "cancelled"].includes(body.status)) {
      return Response.json({ error: "Invalid status" }, { status: 400 });
    }

    const { data, error } = await admin
      .from("orders")
      .update({ status: body.status })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return Response.json({ order: data });
  } catch (e) {
    return authError(e);
  }
}
