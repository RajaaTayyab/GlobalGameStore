"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Zap, Minus, Plus } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/order";

export interface BuyVariant {
  id: string;
  name: string;
  price: number;
  originalPrice: number | null;
  stock: number;
}

interface Props {
  productId: string;
  productSlug: string;
  productName: string;
  productImage: string | null;
  soldOut?: boolean;
  variants: BuyVariant[];
}

export default function ProductBuy({
  productId,
  productSlug,
  productName,
  productImage,
  soldOut,
  variants,
}: Props) {
  const router = useRouter();
  const { addItem } = useCart();
  const [selected, setSelected] = useState<BuyVariant | null>(variants[0] ?? null);
  const [qty, setQty] = useState(1);

  if (soldOut) {
    return (
      <div className="mt-8 rounded-lg border border-red-500/30 bg-surface p-6">
        <p className="text-lg font-bold text-red-400">Sold Out</p>
        <p className="mt-1 text-sm text-text-muted">
          This product is currently unavailable. Please check back later.
        </p>
      </div>
    );
  }

  if (variants.length === 0) {
    return (
      <div className="mt-8 rounded-lg border border-border bg-surface p-6 text-text-muted">
        This product is currently unavailable.
      </div>
    );
  }

  const stock = selected ? selected.stock : 0;

  const handleAdd = () => {
    if (!selected) return;
    addItem({
      variantId: selected.id,
      productId,
      productSlug,
      productName,
      productImage,
      variantName: selected.name,
      unitPrice: selected.price,
      quantity: qty,
      stock: selected.stock,
    });
  };

  const handleBuyNow = () => {
    if (!selected) return;
    addItem({
      variantId: selected.id,
      productId,
      productSlug,
      productName,
      productImage,
      variantName: selected.name,
      unitPrice: selected.price,
      quantity: qty,
      stock: selected.stock,
    });
    router.push("/checkout");
  };

  return (
    <div className="mt-8 rounded-lg border border-border bg-surface p-6">
      <p className="mb-3 text-sm font-medium text-text-muted">Select amount:</p>
      <div className="flex flex-wrap gap-2">
        {variants.map((v) => (
          <button
            key={v.id}
            onClick={() => setSelected(v)}
            className={`rounded-xl border px-4 py-3 text-left transition duration-200 active:scale-[0.99] ${
              selected?.id === v.id
                ? "border-accent-chrome bg-accent-chrome/10 shadow-sm shadow-accent-chrome/10 glow-chrome-sm"
                : "border-border hover:border-accent-chrome/50 hover:bg-surface"
            }`}
          >
            <span className="block text-sm font-semibold text-text-primary">{v.name}</span>
            <span className="block font-mono text-sm font-bold text-price">
              {formatPrice(v.price)}
              {v.originalPrice && (
                <span className="ml-2 font-mono text-xs font-normal text-old-price line-through">
                  {formatPrice(v.originalPrice)}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>

      {selected && (
        <>
          <div className="mt-6 flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-xl border border-border px-2 py-2">
              <button
                onClick={() => setQty((n) => Math.max(1, n - 1))}
                disabled={qty <= 1}
                className="rounded-lg p-1 text-text-muted transition hover:text-text-primary disabled:opacity-30"
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center font-mono font-semibold text-text-primary">{qty}</span>
              <button
                onClick={() => setQty((n) => Math.min(stock > 0 ? stock : 99, n + 1))}
                disabled={stock > 0 && qty >= stock}
                className="rounded-lg p-1 text-text-muted transition hover:text-text-primary disabled:opacity-30"
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-text-muted">
              {stock > 0 ? (
                <span className="text-instock">{stock} codes in stock</span>
              ) : (
                <span className="text-text-muted">
                  Sold via WhatsApp order (no instant code stock)
                </span>
              )}
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={handleAdd}
              className="btn-ripple flex flex-1 items-center justify-center gap-2 rounded-xl border border-accent-chrome/60 px-5 py-3 font-semibold text-accent-chrome transition duration-200 hover:bg-accent-chrome/10 hover:glow-chrome-sm active:scale-[0.98]"
            >
              <ShoppingCart className="h-4 w-4" /> Add to Cart
            </button>
            <button
              onClick={handleBuyNow}
              className="btn-ripple flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent-oxblood px-5 py-3 font-bold text-white shadow-lg shadow-accent-oxblood/25 transition duration-200 hover:bg-accent-oxblood/90 hover:shadow-accent-oxblood/40 hover:glow-oxblood active:scale-[0.98]"
            >
              <Zap className="h-4 w-4" /> Buy Now
            </button>
          </div>
        </>
      )}
    </div>
  );
}