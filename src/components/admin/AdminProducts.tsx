"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  Loader2,
  KeyRound,
} from "lucide-react";
import { formatPrice } from "@/lib/order";
import type { Category, Product, Region, Variant } from "@/lib/types";

interface ProductRow extends Product {
  variants: (Variant & { available: number })[];
  available: number;
}

export default function AdminProducts() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // create/edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    image_url: "",
    category_id: "",
    region_id: "",
    featured: false,
    active: true,
  });

  // variant forms
  const [vName, setVName] = useState("");
  const [vPrice, setVPrice] = useState("");
  const [vOrig, setVOrig] = useState("");
  const [codesInput, setCodesInput] = useState("");
  const [busy, setBusy] = useState(false);

interface ApiVariant extends Variant {
  available?: number;
}

interface ApiProduct extends Product {
  variants?: ApiVariant[];
}

interface ApiResponse {
  products?: ApiProduct[];
  categories?: Category[];
  regions?: Region[];
  available_codes?: Record<string, number>;
  error?: string;
}

  const load = () => {
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then((d: ApiResponse) => {
        if (d.products) {
          setProducts(
            d.products.map((p) => ({
              ...p,
              variants: (p.variants ?? []).map((v) => ({
                ...v,
                available: d.available_codes?.[v.id] ?? 0,
              })),
              available: (p.variants ?? []).reduce(
                (s, v) => s + (d.available_codes?.[v.id] ?? 0),
                0
              ),
            }))
          );
          setCategories(d.categories ?? []);
          setRegions(d.regions ?? []);
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
    setForm({ name: "", description: "", image_url: "", category_id: "", region_id: "", featured: false, active: true });
    setModalOpen(true);
  };

  const openEdit = (p: ProductRow) => {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description ?? "",
      image_url: p.image_url ?? "",
      category_id: p.category_id ?? "",
      region_id: p.region_id ?? "",
      featured: p.featured,
      active: p.active,
    });
    setModalOpen(true);
  };

  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const url = editing ? `/api/admin/products/${editing.id}` : "/api/admin/products";
    const res = await fetch(url, {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        category_id: form.category_id || null,
        region_id: form.region_id || null,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Failed to save");
      return;
    }
    setError("");
    setModalOpen(false);
    load();
    showNotice(editing ? "Product updated" : "Product created — add variants and codes next");
  };

  const deleteProduct = async (p: ProductRow) => {
    if (!confirm(`Delete "${p.name}" and all its variants/codes?`)) return;
    await fetch(`/api/admin/products/${p.id}`, { method: "DELETE" });
    load();
    showNotice("Product deleted");
  };

  const addVariant = async (productId: string) => {
    if (!vName || !vPrice) return;
    const res = await fetch("/api/admin/variants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_id: productId,
        name: vName,
        price: Number(vPrice),
        original_price: vOrig ? Number(vOrig) : null,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to add variant");
      return;
    }
    setVName("");
    setVPrice("");
    setVOrig("");
    load();
    showNotice("Variant added");
  };

  const addCodes = async (variantId: string) => {
    const raw = codesInput.split(/[\n,]+/).map((c) => c.trim()).filter(Boolean);
    if (raw.length === 0) return;
    const res = await fetch("/api/admin/codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variant_id: variantId, codes: raw }),
    });
    const data = await res.json();
    if (data.added) {
      setCodesInput("");
      load();
      showNotice(`${data.added} code(s) added`);
    } else {
      setError(data.error ?? "Failed to add codes");
    }
  };

  const deleteVariant = async (id: string) => {
    if (!confirm("Delete this variant and all its codes?")) return;
    await fetch(`/api/admin/variants/${id}`, { method: "DELETE" });
    load();
    showNotice("Variant deleted");
  };

  const inputCls =
    "w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none";

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );

  return (
    <div className="space-y-6">
      {notice && (
        <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
          {notice}
        </p>
      )}
      {error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{products.length} products</p>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-400"
        >
          <Plus className="h-4 w-4" /> New Product
        </button>
      </div>

      <div className="space-y-3">
        {products.map((p) => (
          <div key={p.id} className="rounded-2xl border border-slate-800 bg-slate-900">
            <div className="flex flex-wrap items-center gap-4 p-4">
              <button
                onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                className="flex flex-1 items-center gap-4 text-left"
              >
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-800">
                  {p.image_url ? (
                    <Image src={p.image_url} alt={p.name} width={56} height={56} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xl">🎮</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-white">
                    {p.name}
                    {!p.active && <span className="ml-2 rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-300">inactive</span>}
                    {p.featured && <span className="ml-2 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-400">sale</span>}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {p.category?.name ?? "No category"} · {p.region?.name ?? "Global"} ·{" "}
                    {p.variants?.length ?? 0} variant(s) ·{" "}
                    <span className={p.available > 0 ? "text-emerald-400" : "text-red-400"}>
                      {p.available} code(s) in stock
                    </span>
                  </p>
                </div>
                {expanded === p.id ? <ChevronUp className="h-5 w-5 text-slate-500" /> : <ChevronDown className="h-5 w-5 text-slate-500" />}
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(p)}
                  className="rounded-lg border border-slate-700 p-2 text-slate-300 hover:border-cyan-500 hover:text-cyan-400"
                  aria-label="Edit product"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => deleteProduct(p)}
                  className="rounded-lg border border-slate-700 p-2 text-slate-300 hover:border-red-500 hover:text-red-400"
                  aria-label="Delete product"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {expanded === p.id && (
              <div className="space-y-5 border-t border-slate-800 p-4">
                {p.variants?.map((v) => (
                  <div key={v.id} className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-white">{v.name}</p>
                        <p className="text-sm text-slate-400">
                          {formatPrice(Number(v.price))}
                          {v.original_price && (
                            <span className="ml-2 line-through">{formatPrice(Number(v.original_price))}</span>
                          )}
                          {" · "}
                          <span className={v.available > 0 ? "text-emerald-400" : "text-red-400"}>
                            {v.available} available
                          </span>
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => addCodes(v.id)}
                          className="rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-cyan-400"
                          disabled={!codesInput.trim()}
                        >
                          Add codes
                        </button>
                        <button
                          onClick={() => deleteVariant(v.id)}
                          className="rounded-lg border border-slate-700 p-1.5 text-slate-400 hover:border-red-500 hover:text-red-400"
                          aria-label="Delete variant"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="grid gap-3 rounded-xl border border-slate-800 bg-slate-950 p-4 sm:grid-cols-4">
                  <input value={vName} onChange={(e) => setVName(e.target.value)} placeholder="Variant name (e.g. 100 UC)" className={inputCls} />
                  <input value={vPrice} onChange={(e) => setVPrice(e.target.value)} type="number" min="0" step="0.01" placeholder="Price" className={inputCls} />
                  <input value={vOrig} onChange={(e) => setVOrig(e.target.value)} type="number" min="0" step="0.01" placeholder="Old price (optional)" className={inputCls} />
                  <button
                    onClick={() => addVariant(p.id)}
                    disabled={!vName || !vPrice}
                    className="rounded-xl bg-slate-700 px-3 py-2.5 text-sm font-semibold text-white hover:bg-slate-600 disabled:opacity-50"
                  >
                    <Plus className="mr-1 inline h-4 w-4" /> Add Variant
                  </button>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                  <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-300">
                    <KeyRound className="h-4 w-4 text-cyan-400" /> Add codes for a variant
                  </label>
                  <textarea
                    value={codesInput}
                    onChange={(e) => setCodesInput(e.target.value)}
                    placeholder={"One code per line or comma separated.\n1234-5678-9012\nABCD-EFGH-IJKL"}
                    rows={3}
                    className={`${inputCls} font-mono`}
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Click &quot;Add codes&quot; on the variant you want to stock.
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Create/Edit modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setModalOpen(false)}>
          <form
            onSubmit={saveProduct}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6"
          >
            <h2 className="text-lg font-bold text-white">{editing ? "Edit product" : "New product"}</h2>
            <div>
              <label className="mb-1.5 block text-sm text-slate-400">Name *</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-slate-400">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className={inputCls} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-slate-400">Image URL</label>
              <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://…" className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm text-slate-400">Category</label>
                <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className={inputCls}>
                  <option value="">None</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-slate-400">Region (recommendations)</label>
                <select value={form.region_id} onChange={(e) => setForm({ ...form, region_id: e.target.value })} className={inputCls}>
                  <option value="">Global</option>
                  {regions.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="accent-cyan-500" />
                Featured (Sale badge)
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="accent-cyan-500" />
                Active
              </label>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 hover:border-slate-500">
                Cancel
              </button>
              <button type="submit" disabled={busy} className="flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-400 disabled:opacity-60">
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing ? "Save Changes" : "Create Product"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
