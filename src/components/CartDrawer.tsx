"use client";

import Link from "next/link";
import Image from "next/image";
import { X, Plus, Minus, Trash2, ShoppingCart, Gamepad2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/order";

export default function CartDrawer() {
  const { items, isOpen, closeCart, updateQuantity, removeItem, total, count } =
    useCart();

  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={closeCart}
      />
      <aside
        className={`glass-strong fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-border shadow-2xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="flex items-center gap-2 font-serif text-lg font-bold text-text-primary">
            <ShoppingCart className="h-5 w-5 text-accent-chrome" />
            Your Cart ({count})
          </h2>
          <button
            onClick={closeCart}
            className="rounded-lg p-1.5 text-text-muted transition duration-200 hover:bg-surface hover:text-text-primary active:scale-90"
            aria-label="Close cart"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <ShoppingCart className="h-12 w-12 text-text-muted" />
              <p className="mt-3 text-text-muted">Your cart is empty</p>
              <Link
                href="/shop"
                onClick={closeCart}
                className="btn-ripple clip-corner mt-4 rounded-lg bg-accent-oxblood px-4 py-2 text-sm font-semibold text-white transition duration-200 hover:bg-accent-oxblood/90 hover:glow-oxblood-sm active:scale-[0.97]"
              >
                Browse Products
              </Link>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li
                  key={item.variantId}
                  className="flex gap-3 rounded-lg border border-border bg-bg p-3"
                >
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-surface">
                    {item.productImage ? (
                      <Image
                        src={item.productImage}
                        alt={item.productName}
                        width={64}
                        height={64}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-bg/40">
                        <Gamepad2 className="h-6 w-6 text-border" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-text-primary">
                      {item.productName}
                    </p>
                    <p className="text-xs text-text-muted">{item.variantName}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-2 rounded-lg border border-border px-1.5 py-0.5">
                        <button
                          onClick={() =>
                            updateQuantity(item.variantId, item.quantity - 1)
                          }
                          disabled={item.quantity <= 1}
                          className="p-0.5 text-text-muted transition hover:text-text-primary disabled:opacity-30"
                          aria-label="Decrease"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-5 text-center font-mono text-sm text-text-primary">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          disabled={!!item.stock && item.stock > 0 && item.quantity >= item.stock}
                          className="p-0.5 text-text-muted transition hover:text-text-primary disabled:opacity-30"
                          aria-label="Increase"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="font-mono text-sm font-bold text-price">
                        {formatPrice(item.unitPrice * item.quantity)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(item.variantId)}
                    className="self-start rounded-lg p-1 text-text-muted hover:bg-surface hover:text-red-400"
                    aria-label="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-border px-5 py-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-text-muted">Total</span>
              <span className="font-mono text-xl font-bold text-price">
                {formatPrice(total)}
              </span>
            </div>
            <div className="flex gap-2">
              <Link
                href="/cart"
                onClick={closeCart}
                className="flex-1 rounded-lg border border-border px-4 py-2.5 text-center text-sm font-semibold text-text-primary transition duration-200 hover:border-accent-chrome/50 hover:bg-surface hover:glow-chrome-sm active:scale-[0.98]"
              >
                View Cart
              </Link>
              <Link
                href="/checkout"
                onClick={closeCart}
                className="btn-ripple flex-1 rounded-lg bg-accent-oxblood px-4 py-2.5 text-center text-sm font-semibold text-white transition duration-200 hover:bg-accent-oxblood/90 hover:glow-oxblood-sm active:scale-[0.98]"
              >
                Checkout
              </Link>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}