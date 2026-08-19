import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getCatalog } from "@/lib/products";
import { getWhatsappNumber } from "@/lib/settings";
import ProductGrid from "@/components/ProductGrid";
import RegionBanner from "@/components/RegionBanner";
import Hero from "@/components/Hero";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [catalog, whatsappPhone] = await Promise.all([getCatalog(), getWhatsappNumber()]);

  return (
    <div>
      {/* Hero (region-aware via IP) */}
      <Hero />

      {/* Location based recommendations, then the full catalog no
          separate category grid, it only ever repeated this same list. */}
      <RegionBanner />
      <section className="relative mx-auto max-w-7xl px-4 py-14">
        <ProductGrid
          products={catalog.products}
          variantsByProduct={catalog.variantsByProduct}
          whatsappPhone={whatsappPhone}
          hidePrice
        />
      </section>

      {/* Closing CTA */}
      <section className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 px-4 py-14">
          <div>
            <h2 className="font-serif text-2xl font-bold text-text-primary sm:text-3xl">
              Didn&apos;t find your game?
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              Full catalog, region filters, and live stock, all on one page.
            </p>
          </div>
          <Link
            href="/shop"
            className="btn-ripple clip-corner group inline-flex items-center gap-2 bg-accent-oxblood px-6 py-3 font-semibold text-white shadow-lg shadow-accent-oxblood/25 transition duration-200 hover:bg-accent-oxblood/90 hover:shadow-accent-oxblood/40 hover:glow-oxblood active:scale-[0.98]"
          >
            Browse the catalog
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </section>
    </div>
  );
}