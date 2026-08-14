import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createClient as createAnonClient } from "@supabase/supabase-js";
import type { Category, Product, Region, Variant } from "./types";

/**
 * Catalog reads are public data, so we use a static anon client instead of the
 * cookie-based server client. That keeps these fetches cache-safe (no cookies/
 * headers inside the cache scope) and lets Next.js serve repeat requests from
 * the Data Cache instead of hitting Supabase every time.
 */
const anonClient = (() => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createAnonClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
})();

export interface Catalog {
  products: Product[];
  variantsByProduct: Record<string, Variant[]>;
  categories: Category[];
  regions: Region[];
}

/* ---------------------------------------------------------------------------
 * Full catalog one Supabase round trip for products (+ variants), categories
 * and regions, cached for 60s across all requests (invalidate with revalidateTag
 * "catalog" if you ever trigger it from the admin side).
 * ------------------------------------------------------------------------- */

interface FullCatalog {
  products: Product[];
  categories: Category[];
  regions: Region[];
}

async function fetchFullCatalog(includeInactive: boolean): Promise<FullCatalog> {
  if (!anonClient) throw new Error("Supabase is not configured");

  let query = anonClient
    .from("products")
    .select(
      "*, category:categories(name), region:regions(code, name), variants:product_variants(*)"
    );
  if (!includeInactive) query = query.eq("active", true);

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;

  const [{ data: categories }, { data: regions }] = await Promise.all([
    anonClient.from("categories").select("*").eq("active", true).order("sort_order"),
    anonClient.from("regions").select("*").order("sort_order"),
  ]);

  return {
    products: (data ?? []) as unknown as Product[],
    categories: (categories ?? []) as Category[],
    regions: (regions ?? []) as Region[],
  };
}

const getCachedFullCatalog = unstable_cache(fetchFullCatalog, ["catalog-full"], {
  tags: ["catalog"],
  revalidate: 60,
});

export async function getCatalog(
  opts: { categorySlug?: string; search?: string; includeInactive?: boolean } = {}
): Promise<Catalog> {
  try {
    const includeInactive = !!opts.includeInactive;
    const { products, categories, regions } = await getCachedFullCatalog(
      includeInactive
    );

    // PostgREST silently ignores filters on embedded columns, so we resolve the
    // category slug -> id up front and then filter in-memory (instant, cache-safe).
    const categoryId = opts.categorySlug
      ? categories.find((c) => c.slug === opts.categorySlug)?.id
      : undefined;

    let filtered = products;
    if (opts.categorySlug && !categoryId) {
      filtered = [];
    } else if (categoryId) {
      filtered = filtered.filter((p) => p.category_id === categoryId);
    }

    const q = opts.search?.trim().toLowerCase();
    if (q) {
      filtered = filtered.filter((p) => p.name.toLowerCase().includes(q));
    }

    const variantsByProduct: Record<string, Variant[]> = {};
    for (const p of filtered) {
      const row = p as unknown as {
        variants?: {
          id: string;
          product_id: string;
          name: string;
          price: number;
          original_price: number | null;
          active: boolean;
        }[];
      };
      variantsByProduct[p.id] = row.variants ?? [];
    }

    return { products: filtered, variantsByProduct, categories, regions };
  } catch (e) {
    console.error("getCatalog error:", e instanceof Error ? e.message : e);
    return { products: [], variantsByProduct: {}, categories: [], regions: [] };
  }
}

/* ---------------------------------------------------------------------------
 * Product by slug cached per slug (60s) and deduped within a request so the
 * metadata + page render share one fetch.
 * ------------------------------------------------------------------------- */
async function fetchProductBySlug(slug: string): Promise<{
  product: Product | null;
  variants: Variant[];
}> {
  if (!anonClient) return { product: null, variants: [] };
  const { data, error } = await anonClient
    .from("products")
    .select("*, category:categories(name), region:regions(code, name)")
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) return { product: null, variants: [] };

  const { data: variants } = await anonClient
    .from("product_variants")
    .select("*")
    .eq("product_id", (data as Product).id)
    .eq("active", true)
    .order("price");

  return {
    product: data as unknown as Product,
    variants: (variants ?? []) as Variant[],
  };
}

export const getProductBySlug = cache(
  unstable_cache((slug: string) => fetchProductBySlug(slug), ["product-slug"], {
    tags: ["product"],
    revalidate: 60,
  })
);

/* ---------------------------------------------------------------------------
 * Available code counts per variant short-lived (30s); stock moves when
 * orders are placed, so we revalidate defensively.
 * ------------------------------------------------------------------------- */
async function fetchAvailableCodeCounts(variantIds: string[]): Promise<Record<string, number>> {
  if (variantIds.length === 0) return {};
  if (!anonClient) return {};
  const { data } = await anonClient
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

export function getAvailableCodeCounts(variantIds: string[]): Promise<Record<string, number>> {
  const sorted = [...variantIds].sort();
  return cache(() =>
    unstable_cache(() => fetchAvailableCodeCounts(sorted), ["code-counts", sorted.join(",")], {
      tags: ["stock"],
      revalidate: 30,
    })()
  )() as Promise<Record<string, number>>;
}