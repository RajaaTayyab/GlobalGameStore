import type { LucideIcon } from "lucide-react";
import Link from "next/link";

interface Props {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: { href: string; label: string; primary?: boolean };
  tone?: "default" | "danger";
}

/**
 * Consistent empty / not-found state used across the storefront and admin.
 * Icon in a tinted chip, serif headline, muted subline, optional CTA.
 */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  tone = "default",
}: Props) {
  const isDanger = tone === "danger";
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface px-6 py-12 text-center">
      <div
        className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${
          isDanger
            ? "bg-red-500/15 text-red-400"
            : "bg-accent-chrome/15 text-accent-chrome"
        }`}
      >
        <Icon className="h-7 w-7" />
      </div>
      <h3
        className={`font-serif text-lg font-bold ${
          isDanger ? "text-red-300" : "text-text-primary"
        }`}
      >
        {title}
      </h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-text-muted">{description}</p>
      )}
      {action && (
        <Link
          href={action.href}
          className={`mt-5 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition duration-200 active:scale-[0.97] ${
            action.primary ?? true
              ? "btn-ripple clip-corner bg-accent-oxblood text-white shadow-lg shadow-accent-oxblood/25 hover:bg-accent-oxblood/90 hover:shadow-accent-oxblood/40"
              : "border border-border text-text-primary hover:border-accent-chrome/50 hover:bg-surface"
          }`}
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
