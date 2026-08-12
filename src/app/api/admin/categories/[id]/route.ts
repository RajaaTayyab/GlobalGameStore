import { requireAdmin, authError } from "@/lib/auth";
import { requireAdminClient } from "@/lib/supabase/admin";
import { revalidateTag } from "next/cache";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const MAX_NAME_LENGTH = 80;

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

    // Name changes never rewrite the slug — /shop?category=psn must keep
    // working even if "PSN" is renamed.
    if ("name" in allowed) {
      const name = typeof allowed.name === "string" ? allowed.name.trim() : "";
      if (!name) {
        return Response.json({ error: "Category name cannot be empty" }, { status: 400 });
      }
      if (name.length > MAX_NAME_LENGTH) {
        return Response.json(
          { error: `Category name must be under ${MAX_NAME_LENGTH} characters` },
          { status: 400 }
        );
      }
      allowed.name = name;
    }
    if ("image_url" in allowed && allowed.image_url !== null) {
      allowed.image_url =
        typeof allowed.image_url === "string" && allowed.image_url.trim()
          ? allowed.image_url.trim()
          : null;
    }
    if ("sort_order" in allowed) {
      const n = Number(allowed.sort_order);
      allowed.sort_order = Number.isFinite(n) ? n : 0;
    }
    if ("active" in allowed) allowed.active = !!allowed.active;

    if (Object.keys(allowed).length === 0) {
      return Response.json({ error: "Nothing to update" }, { status: 400 });
    }

    const { data, error } = await admin
      .from("categories")
      .update(allowed)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    if (!data) {
      return Response.json({ error: "Category not found" }, { status: 404 });
    }

    revalidateTag("catalog", { expire: 0 });
    return Response.json({ category: data });
  } catch (e) {
    return authError(e);
  }
}

export async function DELETE(_req: Request, ctx: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await ctx.params;
    const admin = requireAdminClient();

    // Safety guard: never let a delete silently cascade through the FK and
    // take products (+ their variants/codes) down with it. The admin must
    // move or remove those products first.
    const { count, error: countError } = await admin
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("category_id", id);
    if (countError) throw countError;

    if ((count ?? 0) > 0) {
      return Response.json(
        {
          error: `Cannot delete — ${count} product(s) still in this category. Move or remove them first.`,
        },
        { status: 409 }
      );
    }

    const { error } = await admin.from("categories").delete().eq("id", id);
    if (error) throw error;

    revalidateTag("catalog", { expire: 0 });
    return Response.json({ ok: true });
  } catch (e) {
    return authError(e);
  }
}