"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, MessageCircle } from "lucide-react";
import { useRegion } from "@/context/RegionContext";
import { REGION_LABELS } from "@/lib/constants";
import type { RegionCode } from "@/lib/types";
import TiltCard from "./TiltCard";
import Hero3DScene from "./Hero3DScene";

interface HeroItem {
  slug: string;
  image: string;
  alt: string;
}

const HERO_FEATURED: Record<RegionCode, HeroItem[]> = {
  mena: [{ slug: "yalla-ludo", image: "/images/yalla-ludo.webp", alt: "Yalla Ludo" }],
  pk: [{ slug: "pubg-mobile", image: "/images/pubgmobile.webp", alt: "PUBG Mobile" }],
  us: [
    { slug: "playstation-usa", image: "/images/playstation.webp", alt: "PlayStation" },
    { slug: "xbox", image: "/images/xbox.webp", alt: "Xbox" },
  ],
  global: [
    { slug: "pubg-mobile", image: "/images/pubgmobile.webp", alt: "PUBG Mobile" },
    { slug: "free-fire", image: "/images/freefire.webp", alt: "Free Fire" },
    { slug: "playstation-usa", image: "/images/playstation.webp", alt: "PlayStation" },
    { slug: "xbox", image: "/images/xbox.webp", alt: "Xbox" },
    { slug: "razer-gold-global", image: "/images/razer-gold.webp", alt: "Razer Gold" },
    { slug: "nintendo-eshop-usa", image: "/images/nintendo.webp", alt: "Nintendo" },
  ],
};

export default function Hero() {
  const { region, detected } = useRegion();
  const featured = HERO_FEATURED[region] ?? HERO_FEATURED.global;
  const cols =
    featured.length > 2
      ? "grid-cols-2 sm:grid-cols-3"
      : "grid-cols-1 sm:grid-cols-2";

  return (
    <section className="relative overflow-hidden">
      <Hero3DScene />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(201,175,140,0.10),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(201,175,140,0.08),transparent_55%)]" />
      <div className="bg-grid absolute inset-0" />

      {/* Legibility veil behind the stacked text on narrow screens — the globe
          parks lower-right on mobile, so this softens what sits behind the headline. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[60%] bg-gradient-to-b from-bg/70 via-bg/25 to-transparent lg:hidden" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-20 lg:grid-cols-2 lg:py-28">
        <div className="animate-fade-up">
          <p className="hud-tag mb-5 flex items-center gap-2 font-mono text-xs font-medium uppercase tracking-[0.2em] text-accent-chrome">
            <span className="h-1.5 w-1.5 rounded-full bg-instock shadow-[0_0_6px_1px_var(--color-instock)]" />
            {detected ? `Ranked for ${REGION_LABELS[region]}` : "Full global catalog"}
          </p>
          <h1 className="font-serif text-4xl leading-[1.05] tracking-tight text-text-primary sm:text-5xl lg:text-6xl">
            The vault for{" "}
            <span className="text-accent-chrome italic drop-shadow-[0_0_18px_rgba(201,175,140,0.35)]">
              game credit
            </span>
            .
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-text-muted">
            PUBG, Free Fire, PlayStation, Xbox, Razer Gold and more —
            top-ups and gift cards, released the moment your payment clears.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/shop"
              className="btn-ripple clip-corner group inline-flex items-center gap-2 bg-accent-oxblood px-6 py-3 font-semibold text-white shadow-lg shadow-accent-oxblood/25 transition hover:bg-accent-oxblood/90 hover:shadow-accent-oxblood/40 hover:glow-oxblood active:scale-[0.98]"
            >
              Browse the catalog
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link
              href="/contact"
              className="btn-ripple clip-corner inline-flex items-center gap-2 border border-border px-6 py-3 font-semibold text-text-primary transition hover:border-accent-chrome/50 hover:bg-surface hover:glow-chrome-sm active:scale-[0.98]"
            >
              <MessageCircle className="h-4 w-4" />
              Order on WhatsApp
            </Link>
          </div>
        </div>

        <div className={`grid gap-4 ${cols}`}>
          {featured.map((f, i) => (
            <TiltCard key={f.slug} intensity={7} scale={1.02} className="h-full">
              <Link
                href={`/product/${f.slug}`}
                style={{ animationDelay: `${i * 90}ms` }}
                className="hud-corners group relative flex h-full animate-fade-up overflow-hidden rounded-2xl border border-border shadow-lg transition-[border-color,box-shadow] duration-300 hover:border-accent-chrome/50 hover:shadow-xl hover:shadow-accent-chrome/10"
              >
                <span className="scanlines absolute inset-0" />
                <Image
                  src={f.image}
                  alt={f.alt}
                  width={300}
                  height={300}
                  className="aspect-square w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="font-bold text-text-primary">{f.alt}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-accent-chrome opacity-0 transition duration-300 group-hover:translate-x-0 group-hover:opacity-100 -translate-x-1">
                    Shop now <ArrowRight className="h-3 w-3" />
                  </p>
                </div>
              </Link>
            </TiltCard>
          ))}
        </div>
      </div>
    </section>
  );
}