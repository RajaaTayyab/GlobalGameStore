"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, X, KeyRound, AlertTriangle } from "lucide-react";

export interface AddCodesResult {
  added: number;
  purchased: { count: number; codes: string[] };
  already_in_use: { count: number; codes: string[] };
}

interface Props {
  result: AddCodesResult | null;
  onClose: () => void;
}

const MAX_CODES_IN_DIALOG = 12;

function CodeChips({ codes, tone }: { codes: string[]; tone: "good" | "bad" }) {
  const shown = codes.slice(0, MAX_CODES_IN_DIALOG);
  const more = codes.length - shown.length;
  return (
    <div className="mt-2 flex max-h-32 flex-wrap gap-1.5 overflow-y-auto rounded-lg border border-border bg-bg/70 p-2">
      {shown.map((c) => (
        <code
          key={c}
          className={`rounded-md px-2 py-0.5 font-mono text-[11px] ${
            tone === "good"
              ? "bg-instock/15 text-instock"
              : "bg-amber-500/15 text-amber-300"
          }`}
          title={c}
        >
          {c}
        </code>
      ))}
      {more > 0 && (
        <span className="px-2 py-0.5 text-[11px] text-text-muted">+{more} more</span>
      )}
    </div>
  );
}

export default function AddCodesResultDialog({ result, onClose }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (result) {
      setMounted(true);
    } else {
      setMounted(false);
    }
  }, [result]);

  useEffect(() => {
    if (!result) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [result, onClose]);

  if (!result || !mounted) return null;

  const { added, purchased, already_in_use } = result;
  const purchasedCount = purchased?.count ?? 0;
  const inUseCount = already_in_use?.count ?? 0;
  const hasRejections = purchasedCount > 0 || inUseCount > 0;
  const allRejected = added === 0 && hasRejections;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Add codes result"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-strong clip-corner relative w-full max-w-lg space-y-4 rounded-lg border border-accent-chrome/30 p-6 shadow-2xl"
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 rounded-md p-1.5 text-text-muted transition hover:bg-surface hover:text-text-primary"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3">
          {allRejected ? (
            <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
          ) : added > 0 ? (
            <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-instock/15 text-instock">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          ) : (
            <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
              <XCircle className="h-5 w-5" />
            </div>
          )}
          <div className="min-w-0">
            <h2 className="font-serif text-lg font-bold text-text-primary">
              {allRejected
                ? "No codes were added"
                : added > 0
                ? "Codes added"
                : "Nothing to add"}
            </h2>
            <p className="mt-0.5 text-sm text-text-muted">
              {added > 0 && (
                <>
                  <span className="font-mono font-semibold text-instock">
                    {added}
                  </span>{" "}
                  code{added === 1 ? "" : "s"} added to this variant.
                </>
              )}
              {hasRejections && (
                <>
                  {added > 0 ? " " : ""}
                  Review the items below to see what was rejected and why.
                </>
              )}
              {added === 0 && !hasRejections && "No new codes to add."}
            </p>
          </div>
        </div>

        {purchasedCount > 0 && (
          <section className="rounded-lg border border-amber-500/25 bg-amber-500/5 p-4">
            <p className="flex items-center gap-2 text-sm font-bold text-amber-300">
              <AlertTriangle className="h-4 w-4" />
              {purchasedCount} code{purchasedCount === 1 ? "" : "s"} purchased
              already
            </p>
            <p className="mt-1 text-xs text-amber-400/80">
              These codes were already sold to a customer. They can&apos;t be
              added again.
            </p>
            <CodeChips tone="bad" codes={purchased.codes} />
          </section>
        )}

        {inUseCount > 0 && (
          <section className="rounded-lg border border-amber-500/25 bg-amber-500/5 p-4">
            <p className="flex items-center gap-2 text-sm font-bold text-amber-300">
              <KeyRound className="h-4 w-4" />
              {inUseCount} code{inUseCount === 1 ? "" : "s"} already in use
            </p>
            <p className="mt-1 text-xs text-amber-400/80">
              These codes are already in your inventory. Duplicates are
              blocked by the unique index.
            </p>
            <CodeChips tone="bad" codes={already_in_use.codes} />
          </section>
        )}

        <div className="flex justify-end pt-1">
          <button
            onClick={onClose}
            className="rounded-xl bg-accent-oxblood px-5 py-2 text-sm font-bold text-white shadow-lg shadow-accent-oxblood/25 transition duration-200 hover:bg-accent-oxblood/90 hover:shadow-accent-oxblood/40 active:scale-[0.97]"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
