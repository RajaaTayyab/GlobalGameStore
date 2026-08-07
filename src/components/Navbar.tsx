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
  Sun,
  Moon,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import type { Profile } from "@/lib/types";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
];

const THEME_KEY = "gts-theme";

export default function Navbar() {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window === "undefined") return "dark";
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  });
  const pathname = usePathname();
  const { count, openCart } = useCart();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.profile ?? null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [pathname]);

  useEffect(() => {
    document.documentElement.setAttribute("data-mode", theme);
  }, [theme]);

  const toggleTheme = () => {
    const next: "dark" | "light" = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-mode", next);
    localStorage.setItem(THEME_KEY, next);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-chrome">
            <Gamepad2 className="h-5 w-5 text-bg" />
          </div>
          <span className="font-serif text-lg font-bold tracking-tight text-text-primary">
            Global<span className="text-accent-chrome">GameStore</span>
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
                  ? "bg-surface text-text-primary"
                  : "text-text-muted hover:bg-surface/60 hover:text-text-primary"
              }`}
            >
              {l.label}
            </Link>
          ))}
          {user?.role === "admin" && (
            <Link
              href="/admin"
              className="rounded-lg px-3 py-2 text-sm font-medium text-accent-chrome transition hover:bg-surface/60"
            >
              Admin
            </Link>
          )}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="rounded-lg border border-border p-2 text-text-muted transition hover:border-accent-chrome/50 hover:text-text-primary"
            aria-label="Toggle light/dark mode"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          {/* Cart */}
          <button
            onClick={openCart}
            className="relative rounded-lg border border-border p-2 text-text-muted transition hover:border-accent-chrome/50 hover:text-text-primary"
            aria-label="Cart"
          >
            <ShoppingCart className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent-oxblood text-xs font-bold text-white">
                {count}
              </span>
            )}
          </button>

          {/* Account */}
          <Link
            href={user ? "/account" : "/login"}
            className="rounded-lg border border-border p-2 text-text-muted transition hover:border-accent-chrome/50 hover:text-text-primary"
            aria-label="Account"
          >
            <User className="h-5 w-5" />
          </Link>

          {user && !loading && (
            <span className="hidden rounded-lg bg-surface px-3 py-2 font-mono text-sm font-semibold text-instock lg:inline">
              ${Number(user.credits_balance || 0).toFixed(2)}
            </span>
          )}

          <button
            className="rounded-lg p-2 text-text-muted md:hidden"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <nav className="border-t border-border bg-bg px-4 py-3 md:hidden">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMobileOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-text-muted hover:bg-surface"
            >
              {l.label}
            </Link>
          ))}
          {user?.role === "admin" && (
            <Link
              href="/admin"
              onClick={() => setMobileOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-accent-chrome hover:bg-surface"
            >
              Admin Panel
            </Link>
          )}
          <Link
            href={user ? "/account" : "/login"}
            onClick={() => setMobileOpen(false)}
            className="block rounded-lg px-3 py-2 text-sm font-medium text-text-muted hover:bg-surface"
          >
            {user ? "My Account" : "Login / Register"}
          </Link>
        </nav>
      )}
    </header>
  );
}
