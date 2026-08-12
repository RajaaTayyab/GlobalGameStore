"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useRegion } from "@/context/RegionContext";
import { REGION_LABELS } from "@/lib/constants";

const REGION_GAMES: Record<string, string[]> = {
  pk: ["PUBG Mobile", "Free Fire", "TikTok", "Yalla Live"],
  us: ["PlayStation", "Xbox", "Apple"],
  global: ["PUBG Mobile", "Free Fire", "PlayStation", "Xbox", "Apple", "TikTok"],
};

export default function RegionBanner() {
  const { region, detected } = useRegion();

  if (!detected) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 pb-2 pt-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-text-muted">
            {REGION_LABELS[region]}
          </p>
          <h2 className="mt-1 font-serif text-2xl font-bold text-text-primary sm:text-3xl">
            Popular in your region
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(REGION_GAMES[region] ?? []).map((g) => (
            <span
              key={g}
              className="clip-corner-sm rounded-full border border-border px-3 py-1.5 font-mono text-xs font-semibold text-text-muted transition duration-200 hover:border-accent-chrome/40 hover:text-text-primary"
            >
              {g}
            </span>
          ))}
          <Link
            href="/shop"
            className="flex items-center gap-1 font-mono text-xs font-semibold text-accent-chrome transition hover:gap-1.5"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </section>
  );
}