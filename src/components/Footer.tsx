"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Gamepad2, MessageCircle } from "lucide-react";
import { useRegion } from "@/context/RegionContext";
import type { RegionCode } from "@/lib/types";

// Mirrors ShopControls.tsx: a category only gets a link here if it has a
// product actually visible to the visitor's region. `region: null` means
// the category isn't region-locked at all (visible everywhere).
const FOOTER_CATEGORIES: { slug: string; label: string; region: RegionCode | null }[] = [
  { slug: "pubg-mobile", label: "PUBG Mobile", region: null },
  { slug: "psn", label: "PlayStation", region: "us" },
  { slug: "xbox", label: "Xbox", region: "us" },
  { slug: "itunes", label: "Apple", region: null },
  { slug: "yalla-live", label: "Yalla Live", region: null },
  { slug: "tiktok", label: "TikTok", region: null },
];

export default function Footer() {
  const router = useRouter();
  const { region, detected } = useRegion();

  const visibleCategories = FOOTER_CATEGORIES.filter(
    (c) => !detected || c.region === null || c.region === region
  );

  return (
    <footer className="border-t border-border bg-bg">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link href="/" className="group flex items-center gap-2" aria-label="GlobalGameStore home">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-chrome transition duration-300 group-hover:rounded-xl group-hover:brightness-110 group-hover:shadow-[0_0_12px_2px_rgba(201,175,140,0.35)]">
              <Gamepad2 className="h-5 w-5 text-bg" />
            </div>
            <span className="font-serif text-lg tracking-tight text-text-primary">
              Global<span className="text-accent-chrome">GameStore</span>
            </span>
          </Link>
          <p className="mt-4 text-sm leading-relaxed text-text-muted">
            Game top-ups, gift cards and digital keys. Pay with store credit
            or order straight from WhatsApp.
          </p>
        </div>

        <div>
          <h4 className="mb-4 font-mono text-sm font-semibold uppercase tracking-wider text-text-muted">
            Quick Links
          </h4>
          <ul className="space-y-2 text-sm text-text-muted">
            <li><Link href="/" className="transition-colors hover:text-accent-chrome">Home</Link></li>
            <li><Link href="/shop" className="transition-colors hover:text-accent-chrome">Shop</Link></li>
            <li><Link href="/cart" className="transition-colors hover:text-accent-chrome">Cart</Link></li>
            <li><Link href="/login" className="transition-colors hover:text-accent-chrome">My Account</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 font-mono text-sm font-semibold uppercase tracking-wider text-text-muted">
            Categories
          </h4>
          <ul className="space-y-2 text-sm text-text-muted">
            {visibleCategories.map((c) => (
              <li key={c.slug}>
                <Link href={`/shop?category=${c.slug}`} className="transition-colors hover:text-accent-chrome">
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-4 font-mono text-sm font-semibold uppercase tracking-wider text-text-muted">
            Get In Touch
          </h4>
          <p className="mb-4 text-sm text-text-muted">
            Have questions? Chat with us on WhatsApp.
          </p>
          <button
            onClick={() => router.push("/contact")}
            className="btn-ripple inline-flex items-center gap-2 rounded-lg bg-instock px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-instock/20 transition duration-200 hover:bg-instock/90 hover:shadow-instock/35 hover:glow-instock active:scale-[0.98]"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp Support
          </button>
        </div>
      </div>

      <div className="border-t border-border py-5 text-center text-xs text-text-muted">
        © {new Date().getFullYear()} GlobalGameStore. All Rights Reserved.
      </div>
    </footer>
  );
}