"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Gamepad2, Loader2, Save, UploadCloud, X } from "lucide-react";
import type { Category } from "@/lib/types";

interface CategoryRow extends Category {
  product_count: number;
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = () => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((d) => {
        if (d.categories) {
          setCategories(d.categories);
          setDrafts(Object.fromEntries(d.categories.map((c: CategoryRow) => [c.id, c.image_url ?? ""])));
        } else setError(d.error ?? "Failed to load");
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(""), 3000);
  };

  const handleImageFile = async (categoryId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Only image files are allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5 MB");
      return;
    }
    setUploading(categoryId);
    setError("");
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not upload image");
        return;
      }
      setDrafts((d) => ({ ...d, [categoryId]: data.url }));
      showNotice("Image uploaded — press Save to apply");
    } catch {
      setError("Could not upload image");
    } finally {
      setUploading(null);
    }
  };

  const save = async (c: CategoryRow) => {
    const image_url = (drafts[c.id] ?? "").trim() || null;
    if (image_url === c.image_url) return;
    setBusy(c.id);
    setError("");
    const res = await fetch(`/api/admin/categories/${c.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_url }),
    });
    const data = await res.json();
    setBusy(null);
    if (!res.ok) {
      setError(data.error ?? "Failed to save");
      return;
    }
    load();
    showNotice(`"${c.name}" image updated`);
  };

  const inputCls =
    "w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm text-text-primary transition focus:border-accent-chrome focus:outline-none focus:ring-2 focus:ring-accent-chrome/15";

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-accent-chrome" />
      </div>
    );

  return (
    <div className="space-y-6">
      {notice && (
        <p className="rounded-xl border border-instock/30 bg-instock/10 px-4 py-3 text-sm text-instock">
          {notice}
        </p>
      )}
      {error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      )}

      <p className="text-sm text-text-muted">
        {categories.length} categories — set the artwork shown on the homepage &quot;Shop by Category&quot; tiles.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => (
          <div key={c.id} className="rounded-lg border border-border bg-surface p-4">
            <div className="mb-3 flex items-center gap-3">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-bg">
                {drafts[c.id] ? (
                  <Image src={drafts[c.id]} alt={c.name} width={56} height={56} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Gamepad2 className="h-6 w-6 text-border" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold text-text-primary">{c.name}</p>
                <p className="font-mono text-xs text-text-muted">
                  {c.slug} · {c.product_count} product(s)
                </p>
              </div>
            </div>

            <label
              className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-5 text-sm transition ${
                uploading === c.id
                  ? "cursor-wait opacity-50"
                  : "border-border hover:border-accent-chrome/50 hover:text-accent-chrome"
              }`}
            >
              <UploadCloud className={`h-5 w-5 ${uploading === c.id ? "animate-pulse" : "text-accent-chrome"}`} />
              {uploading === c.id ? "Uploading…" : "Upload image"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading !== null}
                onChange={(e) => handleImageFile(c.id, e)}
              />
            </label>

            <div className="mt-3 flex items-center gap-2">
              <input
                value={drafts[c.id] ?? ""}
                onChange={(e) => setDrafts((d) => ({ ...d, [c.id]: e.target.value }))}
                placeholder="https://… or /images/…"
                className={`${inputCls} font-mono text-xs`}
              />
              {(drafts[c.id] ?? "") !== (c.image_url ?? "") && (
                <button
                  onClick={() => setDrafts((d) => ({ ...d, [c.id]: c.image_url ?? "" }))}
                  className="rounded-lg border border-border p-2 text-text-muted hover:border-red-500 hover:text-red-400"
                  aria-label="Discard changes"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <button
              onClick={() => save(c)}
              disabled={busy === c.id || (drafts[c.id] ?? "").trim() === (c.image_url ?? "")}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-accent-oxblood px-4 py-2.5 text-sm font-bold text-white transition duration-200 hover:bg-accent-oxblood/90 active:scale-[0.98] disabled:opacity-40"
            >
              {busy === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save image
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
