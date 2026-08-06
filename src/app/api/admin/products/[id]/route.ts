import { requireAdmin, authError } from "@/lib/auth";
import { requireAdminClient } from "@/lib/supabase/admin";

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
    for (const key of [
      "name",
      "description",
      "image_url",
      "category_id",
      "region_id",
      "featured",
      "active",
    ]) {
      if (key in body) allowed[key] = body[key];
    }
    if ("name" in allowed && typeof allowed.name === "string" && allowed.name.trim()) {
      allowed.slug = allowed.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
    }

    const { data, error } = await admin
      .from("products")
      .update(allowed)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return Response.json({ product: data });
  } catch (e) {
    return authError(e);
  }
}

export async function DELETE(_req: Request, ctx: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await ctx.params;
    const admin = requireAdminClient();
    await admin.from("products").delete().eq("id", id);
    return Response.json({ ok: true });
  } catch (e) {
    return authError(e);
  }
}
