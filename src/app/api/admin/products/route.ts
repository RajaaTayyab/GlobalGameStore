import { requireAdmin, authError } from "@/lib/auth";
import { requireAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

interface CreateBody {
  name: string;
  description?: string;
  image_url?: string;
  category_id?: string | null;
  region_id?: string | null;
  featured?: boolean;
  variants?: { name: string; price: number; original_price?: number | null; codes?: string[] }[];
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const admin = requireAdminClient();
    const body: CreateBody = await req.json();

    if (!body.name?.trim()) {
      return Response.json({ error: "Product name is required" }, { status: 400 });
    }

    let slug = slugify(body.name);
    const { data: existing } = await admin
      .from("products")
      .select("slug")
      .eq("slug", slug)
      .maybeSingle();
    if (existing) slug = `${slug}-${Date.now().toString(36)}`;

    const { data: product, error } = await admin
      .from("products")
      .insert({
        name: body.name.trim(),
        slug,
        description: body.description ?? null,
        image_url: body.image_url ?? null,
        category_id: body.category_id || null,
        region_id: body.region_id || null,
        featured: !!body.featured,
      })
      .select()
      .single();

    if (error || !product) {
      console.error("create product error:", error);
      return Response.json({ error: "Could not create product" }, { status: 500 });
    }

    if (Array.isArray(body.variants)) {
      for (const v of body.variants) {
        if (!v.name || !v.price) continue;
        const { data: variant } = await admin
          .from("product_variants")
          .insert({
            product_id: product.id,
            name: v.name,
            price: v.price,
            original_price: v.original_price ?? null,
          })
          .select()
          .single();
        const codes = (v.codes ?? [])
          .map((c) => c.trim())
          .filter(Boolean)
          .map((code) => ({ variant_id: variant!.id, code }));
        if (codes.length > 0) await admin.from("codes").insert(codes);
      }
    }

    return Response.json({ product });
  } catch (e) {
    return authError(e);
  }
}
