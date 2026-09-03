import Image from "next/image";
import LoadingToken3D from "@/components/LoadingToken3D";

const SKELETON_CARDS = Array.from({ length: 8 });

export default function Loading() {
  return (
    <div aria-busy="true">
      {/* Branded splash shown during route/page transitions. Logo with a
          soft breathing glow, an ambient 3D chrome token behind it, and
          expanding pulse rings, on the site's own dark surface so it never
          flashes a mismatched white screen. */}
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-bg">
        <div className="relative flex h-28 w-28 items-center justify-center">
          <span className="splash-ring absolute inset-0 rounded-full border border-accent-chrome/40" />
          <span className="splash-ring splash-ring-delay absolute inset-0 rounded-full border border-accent-chrome/40" />
          <div className="relative h-28 w-28">
            <LoadingToken3D />
          </div>
          <div className="animate-splash-bob relative h-20 w-20 overflow-hidden rounded-2xl bg-white p-2 shadow-xl shadow-accent-chrome/20">
            <Image
              src="/images/logo.png"
              alt="GlobalGameStore"
              fill
              priority
              className="object-contain p-1.5"
            />
          </div>
        </div>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-text-muted">
          Loading…
        </p>
      </div>

      {/* Hero skeleton */}
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-20 lg:grid-cols-2 lg:py-28">
        <div className="space-y-5">
          <div className="skeleton h-4 w-40" />
          <div className="skeleton h-12 w-3/4" />
          <div className="skeleton h-5 w-2/3" />
          <div className="flex gap-4 pt-2">
            <div className="skeleton h-11 w-40 rounded-lg" />
            <div className="skeleton h-11 w-44 rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton aspect-square rounded-2xl" />
          ))}
        </div>
      </section>

      {/* Category + product grid */}
      <section className="mx-auto max-w-7xl px-4 pb-14">
        <div className="mb-6">
          <div className="skeleton h-8 w-52" />
          <div className="skeleton mt-3 h-4 w-72" />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {SKELETON_CARDS.map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-lg border border-border bg-surface"
            >
              <div className="skeleton aspect-[4/3] rounded-none" />
              <div className="space-y-3 p-4">
                <div className="skeleton h-3 w-1/3" />
                <div className="skeleton h-4 w-3/4" />
                <div className="skeleton h-5 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}