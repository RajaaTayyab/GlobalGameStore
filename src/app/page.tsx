import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Wallet, MessageCircle } from "lucide-react";
import { getCatalog } from "@/lib/products";
import ProductGrid from "@/components/ProductGrid";
import RegionBanner from "@/components/RegionBanner";
import Hero from "@/components/Hero";
import TiltCard from "@/components/TiltCard";
import SectionGrid3D from "@/components/SectionGrid3D";
import CreditFlow3D from "@/components/CreditFlow3D";
import Gateway3D from "@/components/Gateway3D";

export const dynamic = "force-dynamic";

const CATEGORY_FALLBACKS: Record<string, string> = {
  "free-fire": "/images/freefire.webp",
  "pubg-mobile": "/images/pubgmobile.webp",
  playstation: "/images/playstation.webp",
  psn: "/images/playstation.webp",
  xbox: "/images/xbox.webp",
  itunes: "/images/itunes.webp",
  "razer-gold": "/images/razer-gold.webp",
  "yalla-live": "/images/yalla-ludo.webp",
  tiktok: "/images/tiktok.webp",
  "yalla-ludo": "/images/yalla-ludo.webp",
  jawaker: "/images/jawaker.webp",
};

export default async function HomePage() {
  const catalog = await getCatalog();
  const categories = catalog.categories.filter((c) =>
    catalog.products.some((p) => p.category_id === c.id)
  );

  return (
    <div>
      {/* Hero (region-aware via IP) */}
      <Hero />

      {/* Categories */}
      {categories.length > 0 && (
        <section className="relative mx-auto max-w-7xl overflow-hidden px-4 py-14">
          <SectionGrid3D seed={2} floaters={5} />
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
              <TiltCard key={c.id} intensity={6} className="h-full" scale={1.02}>
              <Link
                href={`/shop?category=${c.slug}`}
                className="group relative flex h-full flex-col overflow-hidden rounded-lg border border-border bg-surface transition-[border-color,box-shadow] duration-300 hover:border-accent-chrome/50 hover:shadow-xl hover:shadow-accent-chrome/10"
              >
                <Image
                  src={c.image_url || CATEGORY_FALLBACKS[c.slug] || "/images/playstation.webp"}
                  alt={c.name}
                  width={400}
                  height={300}
                  className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="font-bold text-text-primary">{c.name}</p>
                  <p className="mt-0.5 flex items-center gap-1 font-mono text-xs font-medium text-accent-chrome opacity-0 transition duration-300 group-hover:translate-x-0 group-hover:opacity-100 -translate-x-1">
                    View all <ArrowRight className="h-3 w-3" />
                  </p>
                </div>
              </Link>
              </TiltCard>
            ))}
          </div>
        </section>
      )}

      {/* Location based recommendations */}
      <RegionBanner />
      <section className="relative mx-auto max-w-7xl overflow-hidden px-4 pb-14">
        <SectionGrid3D seed={3} floaters={4} />
        <ProductGrid
          products={catalog.products}
          variantsByProduct={catalog.variantsByProduct}
          limit={8}
        />
      </section>

      {/* How checkout works — the store's actual point of difference */}
      <section className="relative overflow-hidden border-y border-border">
        <CreditFlow3D seed={5} coins={18} />
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h2 className="font-serif text-3xl font-bold text-text-primary">
              Two ways to check out
            </h2>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-text-muted">
              No forced sign-ups. Pick store credit for one-click reorders, or
              settle it on WhatsApp if you&apos;d rather not make an account.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="card-premium group rounded-lg border border-border bg-surface p-6 hover:border-accent-chrome/40 hover:shadow-lg hover:shadow-accent-chrome/10">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-chrome/10 text-accent-chrome transition duration-300 group-hover:bg-accent-chrome group-hover:text-bg">
                <Wallet className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-serif text-lg font-semibold text-text-primary">
                Store credit
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">
                Top up your balance once. After that, checkout is a single
                click — your code appears on screen and in your inbox the
                second payment clears.
              </p>
            </div>
            <div className="card-premium group rounded-lg border border-border bg-surface p-6 hover:border-accent-chrome/40 hover:shadow-lg hover:shadow-accent-chrome/10">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-instock/10 text-instock transition duration-300 group-hover:bg-instock group-hover:text-bg">
                <MessageCircle className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-serif text-lg font-semibold text-text-primary">
                WhatsApp order
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">
                Send us your cart, no account required. We confirm payment and
                hand-deliver your keys directly in the chat.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="relative mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 overflow-hidden px-4 py-16">
        <Gateway3D seed={7} />
        <h2 className="font-serif text-2xl font-bold text-text-primary sm:text-3xl">
          Find your game&apos;s catalog.
        </h2>
        <Link
          href="/shop"
          className="btn-ripple clip-corner group inline-flex items-center gap-2 bg-accent-oxblood px-6 py-3 font-semibold text-white shadow-lg shadow-accent-oxblood/25 transition duration-200 hover:bg-accent-oxblood/90 hover:shadow-accent-oxblood/40 hover:glow-oxblood active:scale-[0.98]"
        >
          Browse the catalog
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </section>
    </div>
  );
}