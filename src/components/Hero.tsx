"use client";

import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import Hero3DScene from "./Hero3DScene";
import PromoCarousel from "./PromoCarousel";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <Hero3DScene />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(201,175,140,0.10),transparent_55%)]" />
      <div className="bg-grid absolute inset-0" />

      {/* Legibility veil — the globe/grid backdrop was cutting straight
          through the text with nothing behind it. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[70%] bg-gradient-to-b from-bg/80 via-bg/40 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 py-16 lg:py-20">
        {/* Promo banner carousel — swipeable, autoplay, dot pagination */}
        <PromoCarousel />

        {/* Headline — centered, like a search-led storefront rather than a
            marketing banner: the row of games below does the selling. */}
        <div className="animate-fade-up mx-auto mt-12 max-w-2xl text-center">
          <h1 className="font-serif text-4xl leading-[1.05] tracking-tight text-text-primary drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)] sm:text-5xl">
            The vault for{" "}
            <span className="text-accent-chrome italic drop-shadow-[0_0_18px_rgba(201,175,140,0.35)]">
              game credit
            </span>
            .
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-text-primary/80 drop-shadow-[0_1px_8px_rgba(0,0,0,0.55)]">
            PUBG, Free Fire, PlayStation, Xbox, TikTok and more —
            top-ups and gift cards, released the moment your payment clears.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-4">
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
      </div>
    </section>
  );
}