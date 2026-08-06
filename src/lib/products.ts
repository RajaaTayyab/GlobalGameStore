import { createClient } from "./supabase/server";
import type { Category, Product, Region, Variant } from "./types";

export interface Catalog {
  products: Product[];
  variantsByProduct: Record<string, Variant[]>;
  categories: Category[];
  regions: Region[];
}

export async function getCatalog(
  opts: { categorySlug?: string; search?: string; includeInactive?: boolean } = {}
): Promise<Catalog> {
  let supabase;
  try {
    supabase = await createClient();
  } catch (e) {
    console.error("getCatalog: Supabase not configured:", e);
    return { products: [], variantsByProduct: {}, categories: [], regions: [] };
  }

  let query = supabase
    .from("products")
    .select(
      "*, category:categories(name), region:regions(code, name), variants:product_variants(*)",
      { count: "exact" }
    );

  if (!opts.includeInactive) query = query.eq("active", true);

  if (opts.categorySlug) {
    query = query.eq("category.slug", opts.categorySlug);
  }
  if (opts.search) {
    query = query.ilike("name", `%${opts.search}%`);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    console.error("getCatalog error:", error.message);
    return { products: [], variantsByProduct: {}, categories: [], regions: [] };
  }

  const products = (data ?? []) as unknown as Product[];
  const variantsByProduct: Record<string, Variant[]> = {};
  for (const p of products) {
    const row = p as unknown as {
      variants?: { id: string; product_id: string; name: string; price: number; original_price: number | null; active: boolean }[];
    };
    variantsByProduct[p.id] = row.variants ?? [];
  }

  const [{ data: categories }, { data: regions }] = await Promise.all([
    supabase
      .from("categories")
      .select("*")
      .eq("active", true)
      .order("sort_order"),
    supabase.from("regions").select("*").order("sort_order"),
  ]);

  return {
    products,
    variantsByProduct,
    categories: (categories ?? []) as Category[],
    regions: (regions ?? []) as Region[],
  };
}

export async function getProductBySlug(
  slug: string
): Promise<{ product: Product | null; variants: Variant[] }> {
  let supabase;
  try {
    supabase = await createClient();
  } catch (e) {
    console.error("getProductBySlug: Supabase not configured:", e);
    return { product: null, variants: [] };
  }

  const { data, error } = await supabase
    .from("products")
    .select("*, category:categories(name), region:regions(code, name)")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return { product: null, variants: [] };

  const { data: variants } = await supabase
    .from("product_variants")
    .select("*")
    .eq("product_id", (data as Product).id)
    .eq("active", true)
    .order("price");

  return { product: data as unknown as Product, variants: (variants ?? []) as Variant[] };
}

export async function getAvailableCodeCounts(
  variantIds: string[]
): Promise<Record<string, number>> {
  if (variantIds.length === 0) return {};
  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return {};
  }
  const { data } = await supabase
    .from("codes")
    .select("variant_id")
    .in("variant_id", variantIds)
    .eq("status", "available");

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.variant_id] = (counts[row.variant_id] ?? 0) + 1;
  }
  return counts;
}
