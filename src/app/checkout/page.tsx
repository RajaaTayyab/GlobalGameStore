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
    // Stable per-attempt key so network retries don't double-charge.
    const idempotencyKey =
      globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
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
          idempotencyKey,
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
          <CheckCircle2 className="mx-auto h-16 w-16 text-instock" />
          <h1 className="mt-4 font-serif text-2xl font-bold text-text-primary">Order paid with credits!</h1>
          <p className="mt-2 text-text-muted">
            Order <span className="font-mono font-semibold text-accent-chrome">#{result.order.order_number}</span>{" "}
            is complete.
            {result.order.codes_delivered
              ? ` ${result.order.codes_delivered} game code(s) delivered.`
              : ""}
          </p>
          <p className="mt-1 text-text-muted">
            {result.order.email_sent
              ? "Your codes were emailed to you. You can also view them anytime in your account."
              : "Your codes are available in your account and the admin panel."}
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              href="/account"
              className="rounded-xl bg-accent-oxblood px-6 py-3 font-semibold text-white hover:bg-accent-oxblood/90"
            >
              View My Orders
            </Link>
            <Link
              href="/shop"
              className="rounded-xl border border-border px-6 py-3 font-semibold text-text-primary hover:border-accent-chrome/50"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <MessageCircle className="mx-auto h-16 w-16 text-instock" />
        <h1 className="mt-4 font-serif text-2xl font-bold text-text-primary">Order request created!</h1>
        <p className="mt-2 text-text-muted">
          Order <span className="font-mono font-semibold text-accent-chrome">#{result.order?.order_number}</span>{" "}
          is pending. Send the order summary to us on WhatsApp and our team will deliver your
          codes right away.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3">
          <a
            href={result.order?.whatsapp_link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-instock px-6 py-3 font-bold text-white transition hover:bg-instock/90"
          >
            <MessageCircle className="h-5 w-5" /> Send Order on WhatsApp
          </a>
          <Link href="/shop" className="text-sm text-text-muted hover:text-accent-chrome">
            Continue shopping
          </Link>
        </div>
      </div>
    );
  }

  if (result?.error) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-serif text-2xl font-bold text-text-primary">Checkout failed</h1>
        <p className="mt-2 text-red-400">{result.error}</p>
        <button
          onClick={() => setResult(null)}
          className="mt-6 rounded-xl bg-accent-oxblood px-6 py-3 font-semibold text-white hover:bg-accent-oxblood/90"
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
        <ShoppingCart className="mx-auto h-16 w-16 text-text-muted" />
        <h1 className="mt-4 font-serif text-2xl font-bold text-text-primary">Nothing to check out</h1>
        <Link
          href="/shop"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-accent-oxblood px-6 py-3 font-semibold text-white hover:bg-accent-oxblood/90"
        >
          Browse Products <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  /* ---------------- Checkout form ---------------- */
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="mb-8 font-serif text-3xl font-bold text-text-primary">Checkout</h1>
      <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Contact */}
          <div className="rounded-lg border border-border bg-surface p-6">
            <h2 className="mb-4 font-serif text-lg font-bold text-text-primary">Your Details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm text-text-muted">Full name *</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-chrome focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-text-muted">Email *</label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-chrome focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-text-muted">
                  WhatsApp number (digits only, with country code) *
                </label>
                <input
                  required
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="15551234567"
                  className="w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-chrome focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-text-muted">Country</label>
                <input
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Pakistan / UAE / USA…"
                  className="w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-chrome focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Payment method */}
          <div className="rounded-lg border border-border bg-surface p-6">
            <h2 className="mb-4 font-serif text-lg font-bold text-text-primary">Payment Method</h2>
            <div className="space-y-3">
              <label
                className={`flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition ${
                  effectiveMethod === "credits"
                    ? "border-accent-chrome bg-accent-chrome/10"
                    : "border-border hover:border-accent-chrome/50"
                } ${!user ? "opacity-50" : ""}`}
              >
                <input
                  type="radio"
                  name="method"
                  checked={effectiveMethod === "credits"}
                  onChange={() => setMethod("credits")}
                  disabled={!canPayCredits}
                  className="mt-1 accent-oxblood"
                />
                <div className="flex-1">
                  <p className="flex items-center gap-2 font-semibold text-text-primary">
                    <Wallet className="h-4 w-4 text-accent-chrome" />
                    Pay with Store Credits
                  </p>
                  <p className="mt-1 text-sm text-text-muted">
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
                    ? "border-instock bg-instock/10"
                    : "border-border hover:border-instock/50"
                }`}
              >
                <input
                  type="radio"
                  name="method"
                  checked={effectiveMethod === "whatsapp"}
                  onChange={() => setMethod("whatsapp")}
                  className="mt-1 accent-instock"
                />
                <div className="flex-1">
                  <p className="flex items-center gap-2 font-semibold text-text-primary">
                    <MessageCircle className="h-4 w-4 text-instock" />
                    Order via WhatsApp
                  </p>
                  <p className="mt-1 text-sm text-text-muted">
                    We send your order summary to our WhatsApp. Our team confirms and delivers
                    your codes. Works for everyone — no account needed.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="h-fit rounded-lg border border-border bg-surface p-6 lg:sticky lg:top-24">
          <h2 className="mb-4 font-serif text-lg font-bold text-text-primary">Order Summary</h2>
          <ul className="space-y-3">
            {items.map((i) => (
              <li key={i.variantId} className="flex items-center gap-3">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface">
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
                  <p className="line-clamp-1 text-sm font-medium text-text-primary">{i.productName}</p>
                  <p className="text-xs text-text-muted">
                    {i.variantName} × {i.quantity}
                  </p>
                </div>
                <span className="font-mono text-sm font-semibold text-text-primary">
                  {formatPrice(i.unitPrice * i.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between border-t border-border pt-4">
            <span className="font-semibold text-text-primary">Total</span>
            <span className="font-mono text-xl font-bold text-price">{formatPrice(total)}</span>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-accent-oxblood py-3 font-bold text-white shadow-lg shadow-accent-oxblood/25 transition hover:bg-accent-oxblood/90 disabled:opacity-60"
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
            <p className="mt-3 text-center text-xs text-text-muted">Checking your credits…</p>
          )}
          {!user && (
            <p className="mt-3 text-center text-xs text-text-muted">
              Have credits?{" "}
              <Link href="/login" className="text-accent-chrome hover:underline">
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
