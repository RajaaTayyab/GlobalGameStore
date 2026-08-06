"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Plus, Minus, Trash2, ShoppingCart, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/order";

export default function CartPage() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, total, count } = useCart();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center">
        <ShoppingCart className="mx-auto h-16 w-16 text-slate-700" />
        <h1 className="mt-4 text-2xl font-bold text-white">Your cart is empty</h1>
        <p className="mt-2 text-slate-400">Add some game top-ups and gift cards.</p>
        <Link
          href="/shop"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-400"
        >
          Browse Products <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="mb-8 text-3xl font-bold text-white">
        Shopping Cart <span className="text-lg font-normal text-slate-500">({count} items)</span>
      </h1>
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {items.map((item) => (
            <div
              key={item.variantId}
              className="flex gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-4"
            >
              <Link
                href={`/product/${item.productSlug}`}
                className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-800"
              >
                {item.productImage ? (
                  <Image
                    src={item.productImage}
                    alt={item.productName}
                    width={80}
                    height={80}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl">🎮</div>
                )}
              </Link>
              <div className="flex-1">
                <Link
                  href={`/product/${item.productSlug}`}
                  className="font-semibold text-white hover:text-cyan-400"
                >
                  {item.productName}
                </Link>
                <p className="text-sm text-slate-400">{item.variantName}</p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 rounded-lg border border-slate-700 px-2 py-1">
                    <button
                      onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                      className="p-1 text-slate-300 hover:text-white"
                      aria-label="Decrease"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold text-white">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                      className="p-1 text-slate-300 hover:text-white"
                      aria-label="Increase"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-cyan-400">
                      {formatPrice(item.unitPrice * item.quantity)}
                    </span>
                    <button
                      onClick={() => removeItem(item.variantId)}
                      className="rounded-lg p-2 text-slate-500 hover:bg-slate-800 hover:text-red-400"
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="h-fit rounded-2xl border border-slate-800 bg-slate-900 p-6 lg:sticky lg:top-24">
          <h2 className="text-lg font-bold text-white">Order Summary</h2>
          <div className="mt-4 space-y-2 text-sm">
            {items.map((i) => (
              <div key={i.variantId} className="flex justify-between text-slate-400">
                <span className="line-clamp-1">
                  {i.productName} ({i.variantName}) × {i.quantity}
                </span>
                <span>{formatPrice(i.unitPrice * i.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-between border-t border-slate-800 pt-4 text-base">
            <span className="font-semibold text-white">Total</span>
            <span className="text-xl font-bold text-cyan-400">{formatPrice(total)}</span>
          </div>
          <button
            onClick={() => router.push("/checkout")}
            className="mt-6 w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3 font-bold text-white shadow-lg shadow-cyan-500/25 transition hover:shadow-cyan-500/40"
          >
            Proceed to Checkout
          </button>
          <Link
            href="/shop"
            className="mt-3 block text-center text-sm text-slate-400 hover:text-cyan-400"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
