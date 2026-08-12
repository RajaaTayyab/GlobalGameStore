"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Flame, Gamepad2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/order";
import type { Product, Variant } from "@/lib/types";
import TiltCard from "./TiltCard";

interface Props {
  product: Product;
  variants: Variant[];
  regionBadge?: string | null;
  highlight?: boolean;
}

export default function ProductCard({ product, variants, regionBadge, highlight }: Props) {
  const { addItem } = useCart();
  const first = variants.find((v) => v.active) ?? variants[0];
  // Real availability: a variant with codes in stock ships instantly; one
  // with 0 stock is still buyable, just routed to a WhatsApp order instead
  // (see ProductBuy.tsx on the detail page — this mirrors that logic so the
  // grid card and the detail page never disagree again).
  const inStock = (first?.stock ?? 0) > 0;

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
      stock: first.stock,
    });
  };

  return (
    <TiltCard className="h-full" intensity={5} scale={1.015} glare>
      <Link
        href={`/product/${product.slug}`}
        className={`group relative flex h-full flex-col overflow-hidden rounded-lg border bg-surface transition-[border-color,box-shadow] duration-300 ${
          highlight ? "border-accent-chrome/40" : "border-border"
        } hover:border-accent-chrome/50 hover:shadow-xl hover:shadow-accent-chrome/10`}
      >
        <div className="hud-corners border-gradient-chrome relative aspect-[4/3] overflow-hidden bg-surface">
          <span className="scanlines absolute inset-0 z-10" />
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, 25vw"
              className="object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-bg/40">
              <Gamepad2 className="h-12 w-12 text-border" />
            </div>
          )}
          {regionBadge && (
            <span className="clip-corner-sm absolute left-2 top-2 z-20 flex items-center gap-1 bg-accent-chrome px-2.5 py-1 font-mono text-xs font-bold text-bg shadow glow-instock">
              <Flame className="h-3 w-3" /> {regionBadge}
            </span>
          )}
          {product.featured && (
            <span className="clip-corner-sm absolute right-2 top-2 z-20 bg-accent-chrome px-2.5 py-1 font-mono text-xs font-bold text-bg shadow">
              Sale
            </span>
          )}
          {product.sold_out && (
            <span className="absolute inset-0 z-20 flex items-center justify-center bg-bg/60 backdrop-blur-[2px]">
              <span className="rounded-full bg-red-500 px-3 py-1 font-mono text-xs font-bold text-white shadow">
                Sold Out
              </span>
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col p-4">
          <p className="font-mono text-xs uppercase tracking-wider text-text-muted">
            {product.category?.name ?? "Digital Product"}
          </p>
          <h3 className="mt-1 line-clamp-1 font-serif text-base font-semibold text-text-primary transition-colors duration-300 group-hover:text-accent-chrome">
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
            <span className={`text-xs ${inStock ? "text-instock" : "text-text-muted"}`}>
              {inStock
                ? `${first!.stock} in stock`
                : product.sold_out
                  ? "Sold out"
                  : "Order via WhatsApp"}
            </span>
            <button
              onClick={handleAdd}
              disabled={!first || !!product.sold_out}
              className="btn-ripple clip-corner-sm flex items-center gap-1.5 bg-accent-oxblood px-3 py-2 text-xs font-semibold text-white transition duration-200 hover:bg-accent-oxblood/90 hover:glow-oxblood-sm active:scale-[0.97] disabled:opacity-40"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              {product.sold_out ? "Sold out" : "Add to Cart"}
            </button>
          </div>
        </div>
      </Link>
    </TiltCard>
  );
}