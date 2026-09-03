"use client";

import { useEffect, useState } from "react";
import {
  Search,
  Trash2,
  Loader2,
  ShoppingBag,
  X,
} from "lucide-react";
import AdminSkeleton from "@/components/admin/AdminSkeleton";

interface SoldCode {
  id: string;
  code: string;
  status: string;
  created_at: string;
  order_id: string | null;
  variant: {
    name: string;
    product: { id: string; name: string; slug: string; image_url: string | null } | null;
  } | null;
  order: {
    order_number: string;
    customer_email: string | null;
    customer_name: string | null;
    created_at: string;
  } | null;
}

export default function AdminSoldCodes() {
  const [codes, setCodes] = useState<SoldCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/sold-codes")
      .then((r) => r.json())
      .then((d) => {
        if (d.codes) setCodes(d.codes);
        else setError(d.error ?? "Failed to load");
      })
      .catch(() => setError("Failed to load"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDelete = async (c: SoldCode) => {
    const orderLabel = c.order ? ` order #${c.order.order_number}` : "";
    if (
      !window.confirm(
        `Delete this sold code? It will also be removed from the customer's${orderLabel} order record. This cannot be undone.`
      )
    ) {
      return;
    }
    setBusyId(c.id);
    const res = await fetch(`/api/admin/codes/${c.id}`, { method: "DELETE" });
    const data = await res.json();
    setBusyId(null);
    if (res.ok) {
      setCodes((prev) => prev.filter((x) => x.id !== c.id));
    } else {
      setError(data.error ?? "Failed to delete");
      setTimeout(() => setError(""), 3000);
    }
  };

  const q = query.trim().toLowerCase();
  const filtered = q
    ? codes.filter((c) => {
        const hay = [
          c.code,
          c.variant?.name,
          c.variant?.product?.name,
          c.order?.order_number,
          c.order?.customer_email,
          c.order?.customer_name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      })
    : codes;

  if (loading) return <AdminSkeleton rows={4} />;

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-bold text-text-primary">
            <ShoppingBag className="h-5 w-5 text-accent-chrome" />
            Sold codes
          </h2>
          <p className="mt-0.5 text-sm text-text-muted">
            Every code tied to a customer order. Deleting here scrubs the
            code from both inventory and the order record.
          </p>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search code, product, order, customer"
            className="w-72 rounded-xl border border-border bg-bg pl-9 pr-3 py-2 font-mono text-xs text-text-primary placeholder:text-text-muted transition focus:border-accent-chrome focus:outline-none focus:ring-2 focus:ring-accent-chrome/15"
          />
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3 text-xs text-text-muted">
          <span>
            {filtered.length} of {codes.length} sold code
            {codes.length === 1 ? "" : "s"}
            {codes.length > 500 ? " (showing latest 500)" : ""}
          </span>
          {query && (
            <button
              onClick={() => setQuery("")}
              className="flex items-center gap-1 text-accent-chrome transition hover:underline"
            >
              <X className="h-3 w-3" /> clear
            </button>
          )}
        </div>
        {filtered.length === 0 ? (
          <p className="p-10 text-center text-text-muted">
            {codes.length === 0
              ? "No sold codes yet. Codes appear here once they're assigned to a paid order."
              : "No sold codes match your search."}
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center gap-3 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2">
                    <code className="rounded bg-bg px-2 py-1 font-mono text-xs text-accent-chrome">
                      {c.code}
                    </code>
                    {c.variant?.product && (
                      <span className="font-medium text-text-primary">
                        {c.variant.product.name}
                        {c.variant.name && (
                          <span className="text-text-muted">
                            {" "}
                            · {c.variant.name}
                          </span>
                        )}
                      </span>
                    )}
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-text-muted">
                    {c.order && (
                      <span className="font-semibold text-amber-400">
                        #{c.order.order_number}
                      </span>
                    )}
                    {c.order?.customer_name && (
                      <span>{c.order.customer_name}</span>
                    )}
                    {c.order?.customer_email && (
                      <span>{c.order.customer_email}</span>
                    )}
                    <span>{new Date(c.created_at).toLocaleString()}</span>
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(c)}
                  disabled={busyId === c.id}
                  className="flex flex-none items-center gap-1.5 rounded-lg border border-red-500/40 px-3 py-1.5 text-xs font-bold text-red-300 transition hover:border-red-500 hover:bg-red-500 hover:text-white active:scale-[0.97] disabled:opacity-50"
                  title="Delete this sold code from inventory and the order record"
                >
                  {busyId === c.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
