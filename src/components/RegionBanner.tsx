"use client";

import Link from "next/link";
import { MapPin, Flame } from "lucide-react";
import { useRegion } from "@/context/RegionContext";
import { REGION_LABELS } from "@/lib/constants";

const REGION_GAMES: Record<string, string[]> = {
  pk: ["PUBG Mobile", "Free Fire"],
  mena: ["Yalla Ludo", "Jawaker"],
  us: ["PlayStation", "Nintendo", "Xbox"],
  global: ["PUBG Mobile", "Free Fire", "PlayStation", "Xbox", "Razer Gold"],
};

export default function RegionBanner() {
  const { region, detected } = useRegion();

  return (
    <section className="mx-auto max-w-7xl px-4 pb-8 pt-2">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-accent-chrome/30 bg-gradient-to-r from-surface to-bg px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-chrome/15 text-accent-chrome">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-text-muted">
              {detected
                ? `Recommended for you in ${REGION_LABELS[region]}`
                : "Detecting your location for recommendations…"}
            </p>
            <h2 className="flex items-center gap-2 font-serif text-xl font-bold text-text-primary">
              <Flame className="h-5 w-5 text-accent-chrome" />
              Popular in {detected ? REGION_LABELS[region] : "Your Region"}
            </h2>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {(REGION_GAMES[region] ?? []).map((g) => (
            <span
              key={g}
              className="rounded-full border border-border bg-surface px-3 py-1.5 font-mono text-xs font-semibold text-text-primary"
            >
              {g}
            </span>
          ))}
          <Link
            href="/shop"
            className="rounded-full bg-accent-oxblood px-4 py-1.5 text-xs font-bold text-white transition hover:bg-accent-oxblood/90"
          >
            Shop Now
          </Link>
        </div>
      </div>
    </section>
  );
}
