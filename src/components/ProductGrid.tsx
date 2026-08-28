"use client";

import { useMemo } from "react";
import { useRegion } from "@/context/RegionContext";
import ProductCard from "./ProductCard";
import type { Product, Variant } from "@/lib/types";

interface Props {
  products: Product[];
  variantsByProduct: Record<string, Variant[]>;
  limit?: number;
  showRegionBadge?: boolean;
  whatsappPhone?: string;
  hidePrice?: boolean;
}

export default function ProductGrid({
  products,
  variantsByProduct,
  limit,
  showRegionBadge = true,
  whatsappPhone = "",
  hidePrice,
}: Props) {
  const { region, detected } = useRegion();

  const sorted = useMemo(() => {
    // The full catalog is always visible. Region/relevance only influences
    // ordering (region-matched and featured products rank first), never which
    // products are shown.
    const ranked = products.map((p) => {
      let rank = 3;
      if (p.region && p.region.code === region) rank = 0;
      else if (p.region && p.region.code === "global") rank = 2;
      else if (p.region) rank = 1;
      if (p.featured) rank -= 0.5;
      return { p, rank };
    });
    ranked.sort((a, b) => a.rank - b.rank);
    return ranked.map((r) => r.p);
  }, [products, region]);

  const visible = limit ? sorted.slice(0, limit) : sorted;

  if (visible.length === 0) {
    return (
      <p className="rounded-xl border border-border bg-surface p-10 text-center text-text-muted">
        No products found.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
      {visible.map((p, i) => (
        <div key={p.id} className={`animate-fade-up stagger-${(i % 8) + 1}`}>
          <ProductCard
            product={p}
            variants={variantsByProduct[p.id] ?? []}
            highlight={detected && p.region?.code === region}
            whatsappPhone={whatsappPhone}
            hidePrice={hidePrice}
            regionBadge={
              showRegionBadge && detected && p.region && p.region.code === region
                ? `Popular in ${p.region.name}`
                : null
            }
          />
        </div>
      ))}
    </div>
  );
}
