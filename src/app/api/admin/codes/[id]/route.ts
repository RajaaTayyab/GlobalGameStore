import { requireAdmin, authError } from "@/lib/auth";
import { requireAdminClient } from "@/lib/supabase/admin";
import { revalidateTag } from "next/cache";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(_req: Request, ctx: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await ctx.params;
    const admin = requireAdminClient();
    const { error, count } = await admin
      .from("codes")
      .delete({ count: "exact" })
      .eq("id", id);
    if (error) {
      console.error("delete code error:", error);
      return Response.json(
        { error: `Could not delete code: ${error.message}` },
        { status: 500 }
      );
    }
    if (!count) {
      return Response.json({ error: "Code not found" }, { status: 404 });
    }
    revalidateTag("catalog", { expire: 0 });
    revalidateTag("stock", { expire: 0 });
    return Response.json({ ok: true, deleted: count });
  } catch (e) {
    return authError(e);
  }
}
