"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Flame, Gamepad2, MessageCircle } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice, buildWhatsAppLink } from "@/lib/order";
import type { Product, Variant } from "@/lib/types";
import TiltCard from "./TiltCard";

interface Props {
  product: Product;
  variants: Variant[];
  regionBadge?: string | null;
  highlight?: boolean;
  whatsappPhone?: string;
  hidePrice?: boolean;
}

export default function ProductCard({ product, variants, regionBadge, highlight, whatsappPhone = "", hidePrice }: Props) {
  const { addItem } = useCart();
  const first = variants.find((v) => v.active) ?? variants[0];
  // Real availability: a variant with codes in stock ships instantly; one
  // with 0 stock is still buyable, just routed to a WhatsApp order instead
  // (see ProductBuy.tsx on the detail page — this mirrors that logic so the
  // grid card and the detail page never disagree again). A variant manually
  // flagged sold out is not orderable at all.
  const variantSoldOut = !!first?.sold_out;
  const priceOnRequest = !!first?.price_on_request && !variantSoldOut && !product.sold_out;
  const inStock = (first?.stock ?? 0) > 0 && !variantSoldOut;

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
        <div className="hud-corners border-gradient-chrome relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-surface p-5">
          <span className="scanlines absolute inset-0 z-10" />
          {product.image_url ? (
            // Icon chip: every source asset has a different baked-in
            // background (white, black, brand colors, wallpaper art). Rather
            // than let that clash raw against the dark theme, every image
            // sits in its own small rounded card — consistent, deliberate,
            // like an app-store icon — regardless of the source file.
            <div className="relative flex h-full w-full items-center justify-center rounded-xl bg-white p-3 shadow-lg transition duration-500 group-hover:scale-105">
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 50vw, 25vw"
                className="object-contain p-3"
              />
            </div>
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
          <h3 className="line-clamp-1 font-serif text-base font-semibold text-text-primary transition-colors duration-300 group-hover:text-accent-chrome">
            {product.name}
          </h3>
          {/* Fixed-height price row (not just conditional content) so a
              product with no discount doesn't end up a different height
              than one that has one — every card stays the same size,
              same as Codashop's uniform tiles, not just per-row stretch. */}
          <div className="mt-2 flex h-7 items-baseline gap-2">
            {!hidePrice && first && !priceOnRequest && (
              <>
                <span className="font-mono text-lg font-bold text-price">
                  {formatPrice(Number(first.price))}
                </span>
                {first.original_price && Number(first.original_price) > Number(first.price) && (
                  <span className="font-mono text-sm text-old-price line-through">
                    {formatPrice(Number(first.original_price))}
                  </span>
                )}
              </>
            )}
            {!hidePrice && first && priceOnRequest && (
              <span className="font-mono text-sm font-bold text-accent-chrome">Contact for price</span>
            )}
          </div>
          <div className="mt-auto flex h-9 items-center justify-between gap-2 pt-3">
            <span className={`truncate text-xs ${inStock ? "text-instock" : "text-text-muted"}`}>
              {priceOnRequest ? (
                <>
                  <MessageCircle className="mr-1 inline h-3 w-3" /> Contact WhatsApp
                </>
              ) : inStock ? (
                `${first!.stock} in stock`
              ) : product.sold_out || variantSoldOut ? (
                "Sold out"
              ) : (
                "Order via WhatsApp"
              )}
            </span>
            {first && priceOnRequest ? (
              <a
                href={buildWhatsAppLink(
                  whatsappPhone,
                  `Hello! I'd like to know the price for ${product.name} - ${first.name}.`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ripple clip-corner-sm flex flex-none items-center gap-1.5 bg-instock px-3 py-2 text-xs font-semibold text-white transition duration-200 hover:bg-instock/90 hover:glow-instock-sm active:scale-[0.97]"
              >
                <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
              </a>
            ) : (
              <button
                onClick={handleAdd}
                disabled={!first || !!product.sold_out || variantSoldOut}
                className="btn-ripple clip-corner-sm flex flex-none items-center gap-1.5 bg-accent-oxblood px-3 py-2 text-xs font-semibold text-white transition duration-200 hover:bg-accent-oxblood/90 hover:glow-oxblood-sm active:scale-[0.97] disabled:opacity-40"
              >
                <ShoppingCart className="h-3.5 w-3.5" />
                {product.sold_out || variantSoldOut ? "Sold out" : "Add to Cart"}
              </button>
            )}
          </div>
        </div>
      </Link>
    </TiltCard>
  );
}