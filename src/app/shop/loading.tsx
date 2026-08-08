const SKELETON_CARDS = Array.from({ length: 8 });

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10" aria-busy="true">
      <div className="mb-8">
        <div className="skeleton h-9 w-28" />
        <div className="skeleton mt-3 h-4 w-72" />
      </div>

      <div className="mb-8 flex items-center justify-between">
        <div className="skeleton h-10 w-56 rounded-xl" />
        <div className="skeleton h-9 w-24 rounded-full" />
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
    </div>
  );
}