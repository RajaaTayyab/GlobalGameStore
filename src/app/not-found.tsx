import Link from "next/link";
import { Gamepad2, Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-4 py-24 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-accent-chrome/15 text-accent-chrome">
        <Gamepad2 className="h-10 w-10" />
      </div>
      <p className="font-mono text-sm font-semibold uppercase tracking-[0.25em] text-accent-chrome">
        404
      </p>
      <h1 className="mt-2 font-serif text-3xl font-bold text-text-primary sm:text-4xl">
        Game over
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-text-muted">
        We couldn&apos;t find that page. It may have been moved, renamed, or
        never existed in this vault.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="btn-ripple clip-corner inline-flex items-center gap-2 bg-accent-oxblood px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-accent-oxblood/25 transition duration-200 hover:bg-accent-oxblood/90 hover:shadow-accent-oxblood/40 active:scale-[0.98]"
        >
          <Home className="h-4 w-4" /> Go home
        </Link>
        <Link
          href="/shop"
          className="btn-ripple clip-corner inline-flex items-center gap-2 border border-border bg-surface px-5 py-2.5 text-sm font-bold text-text-primary transition duration-200 hover:border-accent-chrome/50 active:scale-[0.98]"
        >
          <Search className="h-4 w-4" /> Browse the shop
        </Link>
      </div>
    </div>
  );
}
