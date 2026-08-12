import { requireAdmin, authError } from "@/lib/auth";
import { requireAdminClient } from "@/lib/supabase/admin";
import { revalidateTag } from "next/cache";

export const dynamic = "force-dynamic";

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const MAX_NAME_LENGTH = 80;

async function uniqueSlug(admin: ReturnType<typeof requireAdminClient>, base: string): Promise<string> {
  const { data: existing } = await admin
    .from("categories")
    .select("slug")
    .like("slug", `${base}%`);
  const taken = new Set((existing ?? []).map((c) => c.slug));
  if (!taken.has(base)) return base;
  let i = 2;
  while (taken.has(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}

export async function GET() {
  try {
    await requireAdmin();
    const admin = requireAdminClient();

    const { data: categories, error } = await admin
      .from("categories")
      .select("*, products:products(count)")
      .order("sort_order");
    if (error) throw error;

    return Response.json({
      categories: (categories ?? []).map((c) => ({
        ...c,
        product_count: c.products?.[0]?.count ?? 0,
      })),
    });
  } catch (e) {
    return authError(e);
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const admin = requireAdminClient();
    const body = await req.json();

    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return Response.json({ error: "Category name is required" }, { status: 400 });
    }
    if (name.length > MAX_NAME_LENGTH) {
      return Response.json(
        { error: `Category name must be under ${MAX_NAME_LENGTH} characters` },
        { status: 400 }
      );
    }

    const slug = await uniqueSlug(admin, slugify(name) || "category");
    const rawImage = typeof body.image_url === "string" ? body.image_url.trim() : "";
    const rawSort =
      typeof body.sort_order === "number" && Number.isFinite(body.sort_order)
        ? body.sort_order
        : null;

    let sortOrder: number | undefined;
    if (rawSort !== null) {
      sortOrder = rawSort;
    } else {
      const { data: maxRow } = await admin
        .from("categories")
        .select("sort_order")
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle();
      sortOrder = (Number(maxRow?.sort_order) || 0) + 10;
    }

    const { data: category, error } = await admin
      .from("categories")
      .insert({
        name,
        slug,
        image_url: rawImage || null,
        sort_order: sortOrder,
        active: body.active !== false,
      })
      .select()
      .single();

    if (error || !category) {
      console.error("create category error:", error);
      return Response.json({ error: "Could not create category" }, { status: 500 });
    }

    revalidateTag("catalog", { expire: 0 });
    return Response.json({ category });
  } catch (e) {
    return authError(e);
  }
}