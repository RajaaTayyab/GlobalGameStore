import Link from "next/link";
import Image from "next/image";
import {
  Zap,
  ShieldCheck,
  Headphones,
  BadgeDollarSign,
  ArrowRight,
  Truck,
  RotateCcw,
} from "lucide-react";
import { getCatalog } from "@/lib/products";
import ProductGrid from "@/components/ProductGrid";
import RegionBanner from "@/components/RegionBanner";
import Hero from "@/components/Hero";

export const dynamic = "force-dynamic";

const CATEGORY_FALLBACKS: Record<string, string> = {
  "free-fire": "/images/freefire.webp",
  "pubg-mobile": "/images/pubgmobile.webp",
  playstation: "/images/playstation.webp",
  xbox: "/images/xbox.webp",
  "razer-gold": "/images/razer-gold.webp",
  nintendo: "/images/nintendo.webp",
  "yalla-ludo": "/images/yalla-ludo.webp",
  jawaker: "/images/jawaker.webp",
};

export default async function HomePage() {
  const catalog = await getCatalog();
  const categories = catalog.categories.filter((c) =>
    catalog.products.some((p) => p.category_id === c.id)
  );

  const whyUs = [
    {
      icon: Zap,
      title: "Instant Code Delivery",
      text: "Get your game codes instantly after payment. No delays, no waiting.",
    },
    {
      icon: BadgeDollarSign,
      title: "Best Market Prices",
      text: "Affordable rates with regular discounts and special offers.",
    },
    {
      icon: ShieldCheck,
      title: "Safe & Secure",
      text: "Safe payments, easy refunds, and a trusted gaming platform.",
    },
    {
      icon: Headphones,
      title: "24/7 Support",
      text: "A dedicated gamer support team whenever you need help.",
    },
  ];

  const perks = [
    { icon: Truck, title: "Shipping Perks", text: "Instant game codes delivery" },
    { icon: RotateCcw, title: "Money Back Guarantee", text: "Safe payments, easy refunds" },
    { icon: Headphones, title: "Customer Service", text: "24/7 gamer support team" },
    { icon: ShieldCheck, title: "Safe Platform", text: "Secure trusted gaming store" },
  ];

  return (
    <div>
      {/* Hero (region-aware via IP) */}
      <Hero />

      {/* Perks strip */}
      <section className="border-y border-border bg-bg/60">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-8 lg:grid-cols-4">
          {perks.map((p) => (
            <div key={p.title} className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-chrome/10 text-accent-chrome">
                <p.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">{p.title}</p>
                <p className="text-xs text-text-muted">{p.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-14">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="font-serif text-2xl font-bold text-text-primary sm:text-3xl">
                Shop by <span className="text-accent-chrome">Category</span>
              </h2>
              <p className="mt-1 text-sm text-text-muted">
                Top-ups, gift cards &amp; in-game currencies for all popular games.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/shop?category=${c.slug}`}
                className="group relative overflow-hidden rounded-lg border border-border bg-surface"
              >
                <Image
                  src={c.image_url || CATEGORY_FALLBACKS[c.slug] || "/images/razer-gold.webp"}
                  alt={c.name}
                  width={400}
                  height={300}
                  className="aspect-[4/3] w-full object-cover transition duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-bg/90 via-bg/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="font-bold text-text-primary">{c.name}</p>
                  <p className="mt-0.5 flex items-center gap-1 font-mono text-xs font-medium text-accent-chrome opacity-0 transition group-hover:opacity-100">
                    View all <ArrowRight className="h-3 w-3" />
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Location based recommendations */}
      <RegionBanner />
      <section className="mx-auto max-w-7xl px-4 pb-14">
        <ProductGrid
          products={catalog.products}
          variantsByProduct={catalog.variantsByProduct}
          limit={8}
        />
      </section>

      {/* Why choose us */}
      <section className="border-y border-border bg-bg/60">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <div className="mb-10 text-center">
            <p className="font-mono text-sm font-semibold uppercase tracking-widest text-accent-chrome">
              Why Choose Us
            </p>
            <h2 className="mt-2 font-serif text-3xl font-bold text-text-primary">
              The Gamer&apos;s Trusted Store
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {whyUs.map((w) => (
              <div
                key={w.title}
                className="rounded-lg border border-border bg-surface p-6 transition hover:border-accent-chrome/40"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-chrome/10 text-accent-chrome">
                  <w.icon className="h-6 w-6" />
                </div>
                <h3 className="font-serif font-semibold text-text-primary">{w.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-muted">{w.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="overflow-hidden rounded-3xl border border-accent-chrome/30 bg-surface px-8 py-14 text-center">
          <h2 className="font-serif text-3xl font-extrabold text-text-primary">
            Ready to level up?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-text-muted">
            Browse hundreds of game top-ups, gift cards and digital keys with
            instant delivery.
          </p>
          <Link
            href="/shop"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-accent-oxblood px-8 py-3.5 font-bold text-white shadow-lg shadow-accent-oxblood/25 transition hover:bg-accent-oxblood/90"
          >
            View All Products <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
