"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MessageCircle,
  Wallet,
  Loader2,
  CheckCircle2,
  ShoppingCart,
  ArrowRight,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/order";
import type { Profile } from "@/lib/types";

interface CheckoutResult {
  ok: boolean;
  order?: {
    id: string;
    order_number: string;
    payment_method: "credits" | "whatsapp";
    status: string;
    whatsapp_link?: string;
    codes_delivered?: number;
    email_sent?: boolean;
  };
  error?: string;
}

export default function CheckoutPage() {
  const { items, total, clear } = useCart();
  const [user, setUser] = useState<Profile | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [country, setCountry] = useState("");
  const [method, setMethod] = useState<"credits" | "whatsapp" | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CheckoutResult | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        setUser(d.profile ?? null);
        if (d.profile) {
          setName(d.profile.full_name ?? "");
          setEmail(d.profile.email ?? "");
          setWhatsapp(d.profile.whatsapp ?? "");
          setCountry(d.profile.country ?? "");
        }
      })
      .finally(() => setLoadingUser(false));
  }, []);

  const balance = Number(user?.credits_balance ?? 0);
  const canPayCredits = user !== null && balance >= total;
  const effectiveMethod: "credits" | "whatsapp" =
    method === null
      ? canPayCredits
        ? "credits"
        : "whatsapp"
      : method === "credits" && !canPayCredits
        ? "whatsapp"
        : method;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            variantId: i.variantId,
            quantity: i.quantity,
          })),
          paymentMethod: effectiveMethod,
          customer: { name, email, whatsapp, country },
        }),
      });
      const data: CheckoutResult = await res.json();
      setResult(data);
      if (data.ok) clear();
    } catch {
      setResult({ ok: false, error: "Something went wrong. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------- Success states ---------------- */
  if (result?.ok) {
    if (result.order?.payment_method === "credits") {
      return (
        <div className="mx-auto max-w-xl px-4 py-24 text-center">
          <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-400" />
          <h1 className="mt-4 text-2xl font-bold text-white">Order paid with credits!</h1>
          <p className="mt-2 text-slate-400">
            Order <span className="font-semibold text-cyan-400">#{result.order.order_number}</span>{" "}
            is complete.
            {result.order.codes_delivered
              ? ` ${result.order.codes_delivered} game code(s) delivered.`
              : ""}
          </p>
          <p className="mt-1 text-slate-500">
            {result.order.email_sent
              ? "Your codes were emailed to you. You can also view them anytime in your account."
              : "Your codes are available in your account and the admin panel."}
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              href="/account"
              className="rounded-xl bg-cyan-500 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-400"
            >
              View My Orders
            </Link>
            <Link
              href="/shop"
              className="rounded-xl border border-slate-700 px-6 py-3 font-semibold text-slate-200 hover:border-slate-500"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <MessageCircle className="mx-auto h-16 w-16 text-emerald-400" />
        <h1 className="mt-4 text-2xl font-bold text-white">Order request created!</h1>
        <p className="mt-2 text-slate-400">
          Order <span className="font-semibold text-cyan-400">#{result.order?.order_number}</span>{" "}
          is pending. Send the order summary to us on WhatsApp and our team will deliver your
          codes right away.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3">
          <a
            href={result.order?.whatsapp_link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white transition hover:bg-emerald-500"
          >
            <MessageCircle className="h-5 w-5" /> Send Order on WhatsApp
          </a>
          <Link href="/shop" className="text-sm text-slate-400 hover:text-cyan-400">
            Continue shopping
          </Link>
        </div>
      </div>
    );
  }

  if (result?.error) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-white">Checkout failed</h1>
        <p className="mt-2 text-red-400">{result.error}</p>
        <button
          onClick={() => setResult(null)}
          className="mt-6 rounded-xl bg-cyan-500 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-400"
        >
          Try Again
        </button>
      </div>
    );
  }

  /* ---------------- Empty cart ---------------- */
  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center">
        <ShoppingCart className="mx-auto h-16 w-16 text-slate-700" />
        <h1 className="mt-4 text-2xl font-bold text-white">Nothing to check out</h1>
        <Link
          href="/shop"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-400"
        >
          Browse Products <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  /* ---------------- Checkout form ---------------- */
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="mb-8 text-3xl font-bold text-white">Checkout</h1>
      <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Contact */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="mb-4 text-lg font-bold text-white">Your Details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm text-slate-400">Full name *</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-slate-400">Email *</label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-slate-400">
                  WhatsApp number (digits only, with country code) *
                </label>
                <input
                  required
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="15551234567"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-slate-400">Country</label>
                <input
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Pakistan / UAE / USA…"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Payment method */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="mb-4 text-lg font-bold text-white">Payment Method</h2>
            <div className="space-y-3">
              <label
                className={`flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition ${
                  effectiveMethod === "credits"
                    ? "border-cyan-500 bg-cyan-500/10"
                    : "border-slate-700 hover:border-slate-500"
                } ${!user ? "opacity-50" : ""}`}
              >
                <input
                  type="radio"
                  name="method"
                  checked={effectiveMethod === "credits"}
                  onChange={() => setMethod("credits")}
                  disabled={!canPayCredits}
                  className="mt-1 accent-cyan-500"
                />
                <div className="flex-1">
                  <p className="flex items-center gap-2 font-semibold text-white">
                    <Wallet className="h-4 w-4 text-cyan-400" />
                    Pay with Store Credits
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    {user
                      ? `Balance: ${formatPrice(balance)} — codes are delivered to your email instantly.`
                      : "Log in to pay with credits. Codes are emailed right after payment."}
                  </p>
                  {user && !canPayCredits && (
                    <p className="mt-1 text-xs text-amber-400">
                      Insufficient credits ({formatPrice(balance)}). Ask an admin to top up, or
                      pay via WhatsApp.
                    </p>
                  )}
                </div>
              </label>

              <label
                className={`flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition ${
                  effectiveMethod === "whatsapp"
                    ? "border-emerald-500 bg-emerald-500/10"
                    : "border-slate-700 hover:border-slate-500"
                }`}
              >
                <input
                  type="radio"
                  name="method"
                  checked={effectiveMethod === "whatsapp"}
                  onChange={() => setMethod("whatsapp")}
                  className="mt-1 accent-emerald-500"
                />
                <div className="flex-1">
                  <p className="flex items-center gap-2 font-semibold text-white">
                    <MessageCircle className="h-4 w-4 text-emerald-400" />
                    Order via WhatsApp
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    We send your order summary to our WhatsApp. Our team confirms and delivers
                    your codes. Works for everyone — no account needed.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="h-fit rounded-2xl border border-slate-800 bg-slate-900 p-6 lg:sticky lg:top-24">
          <h2 className="mb-4 text-lg font-bold text-white">Order Summary</h2>
          <ul className="space-y-3">
            {items.map((i) => (
              <li key={i.variantId} className="flex items-center gap-3">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-800">
                  {i.productImage ? (
                    <Image
                      src={i.productImage}
                      alt={i.productName}
                      width={48}
                      height={48}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">🎮</div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="line-clamp-1 text-sm font-medium text-white">{i.productName}</p>
                  <p className="text-xs text-slate-500">
                    {i.variantName} × {i.quantity}
                  </p>
                </div>
                <span className="text-sm font-semibold text-slate-200">
                  {formatPrice(i.unitPrice * i.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between border-t border-slate-800 pt-4">
            <span className="font-semibold text-white">Total</span>
            <span className="text-xl font-bold text-cyan-400">{formatPrice(total)}</span>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3 font-bold text-white shadow-lg shadow-cyan-500/25 transition hover:shadow-cyan-500/40 disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> Processing…
              </>
            ) : effectiveMethod === "credits" ? (
              <>Pay {formatPrice(total)} with Credits</>
            ) : (
              <>
                <MessageCircle className="h-5 w-5" /> Create WhatsApp Order
              </>
            )}
          </button>
          {loadingUser && (
            <p className="mt-3 text-center text-xs text-slate-500">Checking your credits…</p>
          )}
          {!user && (
            <p className="mt-3 text-center text-xs text-slate-500">
              Have credits?{" "}
              <Link href="/login" className="text-cyan-400 hover:underline">
                Log in
              </Link>{" "}
              to pay with them.
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
