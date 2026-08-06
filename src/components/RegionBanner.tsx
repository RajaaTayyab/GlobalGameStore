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
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/60 to-blue-950/40 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-400">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-slate-400">
              {detected
                ? `Recommended for you in ${REGION_LABELS[region]}`
                : "Detecting your location for recommendations…"}
            </p>
            <h2 className="flex items-center gap-2 text-xl font-bold text-white">
              <Flame className="h-5 w-5 text-orange-400" />
              Popular in {detected ? REGION_LABELS[region] : "Your Region"}
            </h2>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {(REGION_GAMES[region] ?? []).map((g) => (
            <span
              key={g}
              className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-200"
            >
              {g}
            </span>
          ))}
          <Link
            href="/shop"
            className="rounded-full bg-cyan-500 px-4 py-1.5 text-xs font-bold text-slate-950 transition hover:bg-cyan-400"
          >
            Shop Now
          </Link>
        </div>
      </div>
    </section>
  );
}
