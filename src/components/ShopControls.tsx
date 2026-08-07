"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, LayoutGrid } from "lucide-react";
import type { Category } from "@/lib/types";

interface Props {
  categories: Category[];
  activeCategory?: string;
  search?: string;
  total: number;
}

export default function ShopControls({
  categories,
  activeCategory,
  search,
  total,
}: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(search ?? "");

  const navigate = (params: URLSearchParams) => {
    const s = params.toString();
    router.push(s ? `/shop?${s}` : "/shop");
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(sp);
    if (q.trim()) params.set("q", q.trim());
    else params.delete("q");
    navigate(params);
  };

  return (
    <div className="mb-8 space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={submitSearch} className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products…"
            className="w-full rounded-xl border border-border bg-surface py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted transition focus:border-accent-chrome focus:outline-none focus:ring-2 focus:ring-accent-chrome/15"
          />
        </form>
        <p className="flex items-center gap-2 text-sm text-text-muted">
          <LayoutGrid className="h-4 w-4" />
          {total} product{total === 1 ? "" : "s"}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => {
            const params = new URLSearchParams(sp);
            params.delete("category");
            navigate(params);
          }}
          className={`rounded-full px-4 py-2 font-mono text-sm font-medium transition duration-200 active:scale-[0.97] ${
            !activeCategory
              ? "bg-accent-chrome text-bg"
              : "border border-border text-text-muted hover:border-accent-chrome/50 hover:text-text-primary"
          }`}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => {
              const params = new URLSearchParams(sp);
              if (activeCategory === c.slug) params.delete("category");
              else params.set("category", c.slug);
              navigate(params);
            }}
            className={`rounded-full px-4 py-2 font-mono text-sm font-medium transition duration-200 active:scale-[0.97] ${
              activeCategory === c.slug
                ? "bg-accent-chrome text-bg"
                : "border border-border text-text-muted hover:border-accent-chrome/50 hover:text-text-primary"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>
    </div>
  );
}
