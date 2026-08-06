"use client";

import Link from "next/link";
import Image from "next/image";
import { Zap, ArrowRight, Globe } from "lucide-react";
import { useRegion } from "@/context/RegionContext";
import { REGION_LABELS } from "@/lib/constants";
import type { RegionCode } from "@/lib/types";

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
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(34,211,238,0.15),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(59,130,246,0.12),transparent_55%)]" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-20 lg:grid-cols-2 lg:py-28">
        <div>
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-sm font-medium text-cyan-300">
            <Zap className="h-4 w-4" />
            {detected
              ? `Instant Delivery · Featured for ${REGION_LABELS[region]}`
              : "Instant Delivery on All Game Codes"}
          </p>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            Level Up Your{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Gaming Experience
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-400">
            Buy game top-ups, gift cards, and digital keys instantly with fast
            and secure delivery. Play more, wait less — anywhere, anytime.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/shop"
              className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-cyan-500/25 transition hover:shadow-cyan-500/40"
            >
              Explore Deals
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-6 py-3 font-semibold text-slate-200 transition hover:border-slate-500"
            >
              <Globe className="h-4 w-4" />
              Contact Us
            </Link>
          </div>
        </div>

        <div className={`grid gap-4 ${cols}`}>
          {featured.map((f) => (
            <Link
              key={f.slug}
              href={`/product/${f.slug}`}
              className="group relative overflow-hidden rounded-2xl border border-slate-800 shadow-lg transition hover:border-cyan-500/50"
            >
              <Image
                src={f.image}
                alt={f.alt}
                width={300}
                height={300}
                className="aspect-square w-full object-cover transition duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="font-bold text-white">{f.alt}</p>
                <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-cyan-400 opacity-0 transition group-hover:opacity-100">
                  Shop now <ArrowRight className="h-3 w-3" />
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
