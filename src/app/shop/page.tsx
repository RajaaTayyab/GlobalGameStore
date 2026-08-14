import type { Metadata } from "next";
import { getCatalog } from "@/lib/products";
import ProductGrid from "@/components/ProductGrid";
import ShopControls from "@/components/ShopControls";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Buy game top-ups, gift cards, and digital keys. PUBG Mobile, Free Fire, PlayStation, Xbox, Apple, TikTok and more.",
};

export default async function ShopPage(props: { searchParams: Promise<{ category?: string; q?: string }> }) {
  const searchParams = await props.searchParams;
  const category = typeof searchParams.category === "string" ? searchParams.category : undefined;
  const q = typeof searchParams.q === "string" ? searchParams.q : undefined;

  const [catalog, fullCatalog] = await Promise.all([
    getCatalog({ categorySlug: category, search: q }),
    // Unfiltered product list so category pills reflect the whole catalog,
    // not just whatever the active filter narrowed it down to.
    getCatalog(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-text-primary">Shop</h1>
        <p className="mt-1 text-sm text-text-muted">
          All products, recommended picks for your location appear on top.
        </p>
      </div>

      <ShopControls
        categories={catalog.categories}
        products={fullCatalog.products}
        activeCategory={category}
        search={q}
        total={catalog.products.length}
      />

      <ProductGrid
        products={catalog.products}
        variantsByProduct={catalog.variantsByProduct}
      />
    </div>
  );
}