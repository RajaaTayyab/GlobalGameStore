import Link from "next/link";
import { ArrowRight, ShieldCheck, Zap, Wallet, MessageCircle } from "lucide-react";
import { getCatalog } from "@/lib/products";
import ProductGrid from "@/components/ProductGrid";
import RegionBanner from "@/components/RegionBanner";
import Hero from "@/components/Hero";

export const dynamic = "force-dynamic";

const TRUST_POINTS = [
  { icon: Zap, label: "Instant delivery" },
  { icon: ShieldCheck, label: "6 regions covered" },
  { icon: Wallet, label: "Store credit or WhatsApp checkout" },
  { icon: MessageCircle, label: "24/7 support" },
];

export default async function HomePage() {
  const catalog = await getCatalog();

  return (
    <div>
      {/* Hero (region-aware via IP) */}
      <Hero />

      {/* Trust bar — proof, not decoration */}
      <section className="border-y border-border bg-surface/40">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-4 px-4 py-5 sm:justify-between">
          {TRUST_POINTS.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-text-muted">
              <Icon className="h-4 w-4 text-accent-chrome" />
              <span className="font-mono text-xs uppercase tracking-wide">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Location based recommendations, then the full catalog — no
          separate category grid, it only ever repeated this same list. */}
      <RegionBanner />
      <section className="relative mx-auto max-w-7xl px-4 py-14">
        <ProductGrid
          products={catalog.products}
          variantsByProduct={catalog.variantsByProduct}
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
              Full catalog, region filters, and live stock — all on one page.
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