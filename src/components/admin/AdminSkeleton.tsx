interface Props {
  rows?: number;
  className?: string;
}

/**
 * Generic skeleton for admin tabs: a stack of placeholder rows that match
 * the card pattern used by every admin panel. Use while data is loading.
 */
export default function AdminSkeleton({ rows = 4, className = "" }: Props) {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-lg border border-border bg-surface p-4"
        >
          <div className="skeleton h-14 w-14 flex-none rounded-xl" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 w-1/3" />
            <div className="skeleton h-3 w-1/2" />
          </div>
          <div className="flex gap-2">
            <div className="skeleton h-8 w-16 rounded-lg" />
            <div className="skeleton h-8 w-8 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Compact stat-card skeleton for the dashboard. */
export function StatCardSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <div className="skeleton h-3 w-24" />
            <div className="skeleton h-5 w-5 rounded" />
          </div>
          <div className="skeleton mt-3 h-7 w-20" />
        </div>
      ))}
    </div>
  );
}
