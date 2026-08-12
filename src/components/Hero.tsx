"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { ArrowRight, Gamepad2, MessageCircle } from "lucide-react";
import { useRegion } from "@/context/RegionContext";
import type { RegionCode } from "@/lib/types";
import TiltCard from "./TiltCard";
import Hero3DScene from "./Hero3DScene";

interface HeroItem {
  slug: string;
  image: string;
  alt: string;
}

const HERO_FEATURED: Partial<Record<RegionCode, HeroItem[]>> = {
  pk: [
    { slug: "pubg-mobile", image: "/images/pubg-mobile.jpg", alt: "PUBG Mobile" },
    { slug: "free-fire", image: "/images/Free-Fire.jpg", alt: "Free Fire" },
    { slug: "tiktok", image: "/images/tiktok.png", alt: "TikTok" },
  ],
  us: [
    { slug: "psn", image: "/images/psn.png", alt: "PlayStation" },
    { slug: "xbox", image: "/images/xbox.png", alt: "Xbox" },
    { slug: "itunes", image: "/images/Apple_Card.png", alt: "Apple" },
  ],
  global: [
    { slug: "pubg-mobile", image: "/images/pubg-mobile.jpg", alt: "PUBG Mobile" },
    { slug: "free-fire", image: "/images/Free-Fire.jpg", alt: "Free Fire" },
    { slug: "psn", image: "/images/psn.png", alt: "PlayStation" },
    { slug: "xbox", image: "/images/xbox.png", alt: "Xbox" },
    { slug: "itunes", image: "/images/Apple_Card.png", alt: "Apple" },
    { slug: "yalla-live", image: "/images/Yala live.png", alt: "Yalla Live" },
    { slug: "tiktok", image: "/images/tiktok.png", alt: "TikTok" },
  ],
};

/** Featured card art with a themed placeholder fallback so missing product
    art never renders a broken image. Icon chip: every source logo has its
    own baked-in background (white, black, brand color) — rather than let
    that clash raw against the dark hero, each one sits in its own small
    white rounded card, consistent regardless of the source file. */
function HeroArt({ src, alt, label }: { src: string; alt: string; label: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="flex aspect-square w-full items-center justify-center bg-surface">
        <div className="text-center">
          <Gamepad2 className="mx-auto h-10 w-10 text-accent-chrome/60" />
          <p className="mt-2 px-4 font-serif text-lg text-text-primary">{label}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex aspect-square w-full items-center justify-center bg-surface p-5 transition duration-500 group-hover:scale-105">
      <div className="relative h-full w-full rounded-xl bg-white p-3 shadow-lg">
        <Image
          src={src}
          alt={alt}
          fill
          onError={() => setFailed(true)}
          className="object-contain p-3"
        />
      </div>
    </div>
  );
}

export default function Hero() {
  const { region } = useRegion();
  const featured = HERO_FEATURED[region] ?? HERO_FEATURED.global ?? [];
  const cols =
    featured.length > 2
      ? "grid-cols-2 sm:grid-cols-3"
      : "grid-cols-1 sm:grid-cols-2";

  return (
    <section className="relative overflow-hidden">
      <Hero3DScene />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(201,175,140,0.10),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(201,175,140,0.08),transparent_55%)]" />
      <div className="bg-grid absolute inset-0" />

      {/* Legibility veil behind the stacked text — always on, not just
          mobile. The globe/grid backdrop was cutting straight through the
          paragraph text on desktop with nothing behind it. */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-full bg-gradient-to-b from-bg/70 via-bg/35 to-transparent lg:w-[58%] lg:bg-gradient-to-r lg:from-bg/85 lg:via-bg/55 lg:to-transparent" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-20 lg:grid-cols-2 lg:py-28">
        <div className="animate-fade-up">
          <h1 className="font-serif text-4xl leading-[1.05] tracking-tight text-text-primary drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)] sm:text-5xl lg:text-6xl">
            The vault for{" "}
            <span className="text-accent-chrome italic drop-shadow-[0_0_18px_rgba(201,175,140,0.35)]">
              game credit
            </span>
            .
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-text-primary/80 drop-shadow-[0_1px_8px_rgba(0,0,0,0.55)]">
            PUBG, Free Fire, PlayStation, Xbox, TikTok and more —
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
                <HeroArt src={f.image} alt={f.alt} label={f.alt} />
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