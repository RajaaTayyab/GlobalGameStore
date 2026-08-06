"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  ShoppingCart,
  User,
  Gamepad2,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import type { Profile } from "@/lib/types";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
];

export default function Navbar() {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { count, openCart } = useCart();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.profile ?? null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600">
            <Gamepad2 className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            Global<span className="text-cyan-400">GameStore</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                pathname === l.href
                  ? "bg-slate-800 text-white"
                  : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
              }`}
            >
              {l.label}
            </Link>
          ))}
          {user?.role === "admin" && (
            <Link
              href="/admin"
              className="rounded-lg px-3 py-2 text-sm font-medium text-cyan-400 transition hover:bg-slate-800/60"
            >
              Admin
            </Link>
          )}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Cart */}
          <button
            onClick={openCart}
            className="relative rounded-lg border border-slate-700 p-2 text-slate-200 transition hover:border-slate-500"
            aria-label="Cart"
          >
            <ShoppingCart className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500 text-xs font-bold text-slate-950">
                {count}
              </span>
            )}
          </button>

          {/* Account */}
          <Link
            href={user ? "/account" : "/login"}
            className="rounded-lg border border-slate-700 p-2 text-slate-200 transition hover:border-slate-500"
            aria-label="Account"
          >
            <User className="h-5 w-5" />
          </Link>

          {user && !loading && (
            <span className="hidden rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold text-emerald-400 lg:inline">
              ${Number(user.credits_balance || 0).toFixed(2)}
            </span>
          )}

          <button
            className="rounded-lg p-2 text-slate-300 md:hidden"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <nav className="border-t border-slate-800 bg-slate-950 px-4 py-3 md:hidden">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMobileOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
            >
              {l.label}
            </Link>
          ))}
          {user?.role === "admin" && (
            <Link
              href="/admin"
              onClick={() => setMobileOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-cyan-400 hover:bg-slate-800"
            >
              Admin Panel
            </Link>
          )}
          <Link
            href={user ? "/account" : "/login"}
            onClick={() => setMobileOpen(false)}
            className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
          >
            {user ? "My Account" : "Login / Register"}
          </Link>
        </nav>
      )}
    </header>
  );
}
