import { requireAdmin, authError } from "@/lib/auth";
import { requireAdminClient } from "@/lib/supabase/admin";
import { revalidateTag } from "next/cache";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(req: Request, ctx: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await ctx.params;
    const admin = requireAdminClient();
    const body = await req.json();

    const allowed: Record<string, unknown> = {};
    for (const key of ["name", "image_url", "sort_order", "active"]) {
      if (key in body) allowed[key] = body[key];
    }

    const { data, error } = await admin
      .from("categories")
      .update(allowed)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;

    revalidateTag("catalog", { expire: 0 });
    return Response.json({ category: data });
  } catch (e) {
    return authError(e);
  }
}
