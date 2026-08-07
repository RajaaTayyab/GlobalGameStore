"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/order";
import type { Product, Variant } from "@/lib/types";

interface Props {
  product: Product;
  variants: Variant[];
  regionBadge?: string | null;
  highlight?: boolean;
}

export default function ProductCard({ product, variants, regionBadge, highlight }: Props) {
  const { addItem } = useCart();
  const first = variants.find((v) => v.active) ?? variants[0];

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!first) return;
    addItem({
      variantId: first.id,
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      productImage: product.image_url,
      variantName: first.name,
      unitPrice: Number(first.price),
      quantity: 1,
    });
  };

  return (
    <Link
      href={`/product/${product.slug}`}
      className={`group relative flex flex-col overflow-hidden rounded-lg border bg-surface transition hover:-translate-y-1 hover:border-accent-chrome/50 hover:shadow-xl hover:shadow-accent-chrome/10 ${
        highlight ? "border-accent-chrome/40" : "border-border"
      }`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-surface">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl">
            🎮
          </div>
        )}
        {regionBadge && (
          <span className="absolute left-2 top-2 rounded-full bg-accent-chrome px-2.5 py-1 text-xs font-bold text-bg shadow">
            🔥 {regionBadge}
          </span>
        )}
        {product.featured && (
          <span className="absolute right-2 top-2 rounded-full bg-accent-chrome px-2.5 py-1 font-mono text-xs font-bold text-bg">
            Sale
          </span>
        )}
        {product.sold_out && (
          <span className="absolute inset-0 flex items-center justify-center bg-bg/60">
            <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white shadow">
              Sold Out
            </span>
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="font-mono text-xs uppercase tracking-wider text-text-muted">
          {product.category?.name ?? "Digital Product"}
        </p>
        <h3 className="mt-1 line-clamp-1 font-serif text-base font-semibold text-text-primary group-hover:text-accent-chrome">
          {product.name}
        </h3>
        {first && (
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-lg font-bold text-price">
              {formatPrice(Number(first.price))}
            </span>
            {first.original_price && Number(first.original_price) > Number(first.price) && (
              <span className="font-mono text-sm text-old-price line-through">
                {formatPrice(Number(first.original_price))}
              </span>
            )}
          </div>
        )}
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="text-xs text-text-muted">
            {variants.length > 1 ? `${variants.length} options` : "In stock"}
          </span>
          <button
            onClick={handleAdd}
            disabled={!first || !!product.sold_out}
            className="flex items-center gap-1.5 rounded-lg bg-accent-oxblood px-3 py-2 text-xs font-semibold text-white transition hover:bg-accent-oxblood/90 disabled:opacity-40"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            {product.sold_out ? "Sold out" : "Add to Cart"}
          </button>
        </div>
      </div>
    </Link>
  );
}
