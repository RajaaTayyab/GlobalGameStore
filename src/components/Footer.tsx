"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Gamepad2, MessageCircle } from "lucide-react";

export default function Footer() {
  const router = useRouter();

  return (
    <footer className="border-t border-slate-800 bg-slate-950">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600">
              <Gamepad2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">
              Global<span className="text-cyan-400">GameStore</span>
            </span>
          </Link>
          <p className="mt-4 text-sm leading-relaxed text-slate-400">
            Your trusted source for game top-ups, gift cards, and digital gaming
            products with fast and secure delivery.
          </p>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-300">
            Quick Links
          </h4>
          <ul className="space-y-2 text-sm text-slate-400">
            <li><Link href="/" className="hover:text-cyan-400">Home</Link></li>
            <li><Link href="/shop" className="hover:text-cyan-400">Shop</Link></li>
            <li><Link href="/cart" className="hover:text-cyan-400">Cart</Link></li>
            <li><Link href="/login" className="hover:text-cyan-400">My Account</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-300">
            Why Us
          </h4>
          <ul className="space-y-2 text-sm text-slate-400">
            <li>Instant game code delivery</li>
            <li>Money back guarantee</li>
            <li>24/7 gamer support</li>
            <li>Best market prices</li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-300">
            Get In Touch
          </h4>
          <p className="mb-4 text-sm text-slate-400">
            Have questions? Chat with us on WhatsApp.
          </p>
          <button
            onClick={() => router.push("/contact")}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp Support
          </button>
        </div>
      </div>

      <div className="border-t border-slate-800 py-5 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} GlobalGameStore. All Rights Reserved.
      </div>
    </footer>
  );
}
