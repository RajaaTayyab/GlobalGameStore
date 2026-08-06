"use client";

import Link from "next/link";
import Image from "next/image";
import { X, Plus, Minus, Trash2, ShoppingCart } from "lucide-react";
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
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-slate-800 bg-slate-900 shadow-2xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <h2 className="flex items-center gap-2 text-lg font-bold text-white">
            <ShoppingCart className="h-5 w-5 text-cyan-400" />
            Your Cart ({count})
          </h2>
          <button
            onClick={closeCart}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800"
            aria-label="Close cart"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <ShoppingCart className="h-12 w-12 text-slate-600" />
              <p className="mt-3 text-slate-400">Your cart is empty</p>
              <Link
                href="/shop"
                onClick={closeCart}
                className="mt-4 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
              >
                Browse Products
              </Link>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li
                  key={item.variantId}
                  className="flex gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3"
                >
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-800">
                    {item.productImage ? (
                      <Image
                        src={item.productImage}
                        alt={item.productName}
                        width={64}
                        height={64}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-500">
                        ?
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">
                      {item.productName}
                    </p>
                    <p className="text-xs text-slate-400">{item.variantName}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-2 rounded-lg border border-slate-700 px-1.5 py-0.5">
                        <button
                          onClick={() =>
                            updateQuantity(item.variantId, item.quantity - 1)
                          }
                          className="p-0.5 text-slate-300 hover:text-white"
                          aria-label="Decrease"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-5 text-center text-sm text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.variantId, item.quantity + 1)
                          }
                          className="p-0.5 text-slate-300 hover:text-white"
                          aria-label="Increase"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="text-sm font-bold text-cyan-400">
                        {formatPrice(item.unitPrice * item.quantity)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(item.variantId)}
                    className="self-start rounded-lg p-1 text-slate-500 hover:bg-slate-800 hover:text-red-400"
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
          <div className="border-t border-slate-800 px-5 py-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-slate-400">Total</span>
              <span className="text-xl font-bold text-white">
                {formatPrice(total)}
              </span>
            </div>
            <div className="flex gap-2">
              <Link
                href="/cart"
                onClick={closeCart}
                className="flex-1 rounded-lg border border-slate-700 px-4 py-2.5 text-center text-sm font-semibold text-slate-200 hover:border-slate-500"
              >
                View Cart
              </Link>
              <Link
                href="/checkout"
                onClick={closeCart}
                className="flex-1 rounded-lg bg-cyan-500 px-4 py-2.5 text-center text-sm font-semibold text-slate-950 hover:bg-cyan-400"
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
