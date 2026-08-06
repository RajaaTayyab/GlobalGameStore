import type { Metadata } from "next";
import { getCatalog } from "@/lib/products";
import ProductGrid from "@/components/ProductGrid";
import ShopControls from "@/components/ShopControls";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Buy game top-ups, gift cards, and digital keys. PUBG Mobile, Free Fire, PlayStation, Xbox, Nintendo, Razer Gold and more.",
};

export default async function ShopPage(props: PageProps<"/shop">) {
  const searchParams = await props.searchParams;
  const category = typeof searchParams.category === "string" ? searchParams.category : undefined;
  const q = typeof searchParams.q === "string" ? searchParams.q : undefined;

  const catalog = await getCatalog({ categorySlug: category, search: q });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Shop</h1>
        <p className="mt-1 text-sm text-slate-400">
          All products — recommended picks for your location appear on top.
        </p>
      </div>

      <ShopControls
        categories={catalog.categories}
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
