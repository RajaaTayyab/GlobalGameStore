"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Gamepad2, Loader2, Pencil, Plus, Save, Trash2, UploadCloud, X } from "lucide-react";
import type { Category } from "@/lib/types";

interface CategoryRow extends Category {
  product_count: number;
}

const emptyForm = { name: "", image_url: "" };

export default function AdminCategories() {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  // create/edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (c: CategoryRow) => {
    setEditing(c);
    setForm({ name: c.name, image_url: c.image_url ?? "" });
    setModalOpen(true);
  };

  const handleModalImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
    setUploading("modal");
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
      setForm((f) => ({ ...f, image_url: data.url }));
    } catch {
      setError("Could not upload image");
    } finally {
      setUploading(null);
    }
  };

  const saveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) {
      setError("Category name is required");
      return;
    }
    setSaving(true);
    setError("");
    const res = await fetch(
      editing ? `/api/admin/categories/${editing.id}` : "/api/admin/categories",
      {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, image_url: form.image_url.trim() || null }),
      }
    );
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Failed to save");
      return;
    }
    setModalOpen(false);
    load();
    showNotice(editing ? `"${name}" updated` : `"${name}" created`);
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

  const saveImage = async (c: CategoryRow) => {
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

  const deleteCategory = async (c: CategoryRow) => {
    const confirmMsg =
      c.product_count > 0
        ? `"${c.name}" still has ${c.product_count} product(s). The delete will be blocked until they're moved or removed. Continue?`
        : `Delete "${c.name}"? This cannot be undone.`;
    if (!window.confirm(confirmMsg)) return;
    setDeletingId(c.id);
    setError("");
    const res = await fetch(`/api/admin/categories/${c.id}`, { method: "DELETE" });
    const data = await res.json();
    setDeletingId(null);
    if (!res.ok) {
      setError(data.error ?? "Failed to delete");
      return;
    }
    load();
    showNotice(`"${c.name}" deleted`);
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

      <div className="flex items-center justify-between">
        <p className="text-sm text-text-muted">
          {categories.length} categories — set the artwork shown on the homepage &quot;Shop by Category&quot; tiles.
        </p>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl bg-accent-oxblood px-4 py-2.5 text-sm font-bold text-white transition duration-200 hover:bg-accent-oxblood/90 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" /> New Category
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => (
          <div key={c.id} className="rounded-lg border border-border bg-surface p-4">
            <div className="mb-3 flex items-start gap-3">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-bg">
                {drafts[c.id] ? (
                  <Image src={drafts[c.id]} alt={c.name} width={56} height={56} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Gamepad2 className="h-6 w-6 text-border" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-text-primary">{c.name}</p>
                <p className="font-mono text-xs text-text-muted">
                  {c.slug} · {c.product_count} product(s)
                </p>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <button
                  onClick={() => openEdit(c)}
                  className="rounded-lg border border-border p-2 text-text-muted transition hover:border-accent-chrome hover:text-accent-chrome"
                  aria-label={`Edit ${c.name}`}
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => deleteCategory(c)}
                  disabled={deletingId === c.id}
                  className="rounded-lg border border-border p-2 text-text-muted transition hover:border-red-500 hover:text-red-400 disabled:opacity-40"
                  aria-label={`Delete ${c.name}`}
                >
                  {deletingId === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </button>
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
              onClick={() => saveImage(c)}
              disabled={busy === c.id || (drafts[c.id] ?? "").trim() === (c.image_url ?? "")}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-accent-oxblood px-4 py-2.5 text-sm font-bold text-white transition duration-200 hover:bg-accent-oxblood/90 active:scale-[0.98] disabled:opacity-40"
            >
              {busy === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save image
            </button>
          </div>
        ))}
      </div>

      {/* Create/Edit modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setModalOpen(false)}
        >
          <form
            onSubmit={saveCategory}
            onClick={(e) => e.stopPropagation()}
            className="glass-strong clip-corner max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-lg border border-accent-chrome/20 p-6 shadow-2xl"
          >
            <h2 className="font-serif text-lg font-bold text-text-primary">
              {editing ? "Edit category" : "New category"}
            </h2>
            <div>
              <label className="mb-1.5 block text-sm text-text-muted">Name *</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Steam Wallet"
                className={inputCls}
              />
              {editing && (
                <p className="mt-1 text-xs text-text-muted">
                  Slug stays <span className="font-mono">{editing.slug}</span> so existing shop links keep working.
                </p>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-text-muted">Category image</label>
              {form.image_url && (
                <div className="mb-3 flex items-start justify-between gap-3">
                  <Image
                    src={form.image_url}
                    alt="Preview"
                    width={96}
                    height={64}
                    className="h-16 w-24 rounded-xl border border-border object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, image_url: "" })}
                    className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-text-muted hover:border-red-500/50 hover:text-red-400"
                  >
                    <X className="h-3.5 w-3.5" /> Remove
                  </button>
                </div>
              )}
              <label
                className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-6 text-sm transition ${
                  uploading === "modal"
                    ? "cursor-wait opacity-50"
                    : "border-border hover:border-accent-chrome/50 hover:text-accent-chrome"
                }`}
              >
                <UploadCloud className={`h-6 w-6 ${uploading === "modal" ? "animate-pulse" : "text-accent-chrome"}`} />
                {uploading === "modal" ? "Uploading…" : "Click to upload image"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleModalImageFile}
                  disabled={uploading !== null}
                />
              </label>
              <input
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                placeholder="https://… or /images/…"
                className={`${inputCls} mt-2 font-mono text-xs`}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-text-muted hover:border-accent-chrome/50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-accent-oxblood px-5 py-2.5 text-sm font-bold text-white transition duration-200 hover:bg-accent-oxblood/90 active:scale-[0.98] disabled:opacity-60"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing ? "Save Changes" : "Create Category"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}