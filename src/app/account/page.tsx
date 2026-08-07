"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Wallet,
  User,
  LogOut,
  Loader2,
  Copy,
  CheckCircle2,
  CreditCard,
} from "lucide-react";
import { formatPrice } from "@/lib/order";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import type { CreditTransaction, Order, Profile } from "@/lib/types";

type Tab = "overview" | "orders" | "credits" | "profile";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-400",
  paid: "bg-accent-chrome/15 text-accent-chrome",
  completed: "bg-instock/15 text-instock",
  cancelled: "bg-red-500/15 text-red-400",
};

export default function AccountPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [notAuthed, setNotAuthed] = useState(false);

  const [form, setForm] = useState({ full_name: "", phone: "", whatsapp: "", country: "" });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const [pw, setPw] = useState({ currentPassword: "", password: "", confirm: "" });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [deleteMsg, setDeleteMsg] = useState("");

  useEffect(() => {
    (async () => {
      const me = await fetch("/api/auth/me").then((r) => r.json());
      if (!me.profile) {
        setNotAuthed(true);
        setLoading(false);
        return;
      }
      setProfile(me.profile);
      setForm({
        full_name: me.profile.full_name ?? "",
        phone: me.profile.phone ?? "",
        whatsapp: me.profile.whatsapp ?? "",
        country: me.profile.country ?? "",
      });
      const [o, t] = await Promise.all([
        fetch("/api/account/orders").then((r) => r.json()),
        fetch("/api/account/transactions").then((r) => r.json()),
      ]);
      setOrders(o.orders ?? []);
      setTransactions(t.transactions ?? []);
      setLoading(false);
    })();
  }, []);

  if (notAuthed) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-serif text-2xl font-bold text-text-primary">Please log in</h1>
        <p className="mt-2 text-text-muted">You need an account to view your panel.</p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-xl bg-accent-oxblood px-6 py-3 font-semibold text-white hover:bg-accent-oxblood/90"
        >
          Log In
        </Link>
      </div>
    );
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    const res = await fetch("/api/account/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.profile) {
      setProfile((p) => (p ? { ...p, ...data.profile } : p));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Delete your account permanently? This cannot be undone.")) return;
    const res = await fetch("/api/account/delete", { method: "DELETE" });
    const data = await res.json();
    if (data.ok) {
      router.push("/");
      router.refresh();
    } else {
      setDeleteMsg(data.error ?? "Could not delete account");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwSaving(true);
    setPwMsg(null);
    const res = await fetch("/api/account/password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pw),
    });
    const data = await res.json();
    if (data.ok) {
      setPw({ currentPassword: "", password: "", confirm: "" });
      setPwMsg({ ok: true, text: "Password updated!" });
    } else {
      setPwMsg({ ok: false, text: data.error ?? "Could not update password" });
    }
    setPwSaving(false);
  };

  const copyCode = (code: string) => {
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopied(code);
    setTimeout(() => setCopied(null), 1500);
  };

  const tabs: { id: Tab; label: string; icon: typeof Package }[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "orders", label: "Orders", icon: Package },
    { id: "credits", label: "Credits", icon: Wallet },
    { id: "profile", label: "Profile", icon: User },
  ];

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent-chrome" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-text-primary">
            {profile?.full_name ? `Hi, ${profile.full_name.split(" ")[0]}` : "My Account"}
          </h1>
          <p className="mt-1 text-sm text-text-muted">{profile?.email}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-instock/30 bg-instock/10 px-5 py-3">
            <p className="text-xs text-instock/80">Store Credits</p>
            <p className="font-mono text-xl font-bold text-instock">
              {formatPrice(Number(profile?.credits_balance ?? 0))}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-medium text-text-muted hover:border-red-500/50 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              tab === t.id
                ? "bg-accent-chrome text-bg"
                : "border border-border text-text-muted hover:border-accent-chrome/50"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ---------------- Overview ---------------- */}
      {tab === "overview" && (
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-surface p-6">
            <CreditCard className="h-6 w-6 text-accent-chrome" />
            <p className="mt-3 font-mono text-3xl font-bold text-text-primary">
              {formatPrice(Number(profile?.credits_balance ?? 0))}
            </p>
            <p className="mt-1 text-sm text-text-muted">Available credits</p>
            <p className="mt-2 text-xs text-text-muted">
              Codes are emailed after you pay with credits.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-surface p-6">
            <Package className="h-6 w-6 text-accent-chrome" />
            <p className="mt-3 font-mono text-3xl font-bold text-text-primary">{orders.length}</p>
            <p className="mt-1 text-sm text-text-muted">Total orders</p>
            <p className="mt-2 text-xs text-text-muted">
              {orders.filter((o) => o.status === "completed").length} completed
            </p>
          </div>
          <div className="rounded-lg border border-border bg-surface p-6">
            <Wallet className="h-6 w-6 text-accent-chrome" />
            <p className="mt-3 font-mono text-3xl font-bold text-text-primary">{transactions.length}</p>
            <p className="mt-1 text-sm text-text-muted">Credit movements</p>
            <p className="mt-2 text-xs text-text-muted">
              Top-ups and purchases tracked here.
            </p>
          </div>
          {orders.slice(0, 3).map((o) => (
            <div key={o.id} className="rounded-lg border border-border bg-surface p-6 sm:col-span-3">
              <div className="flex items-center justify-between">
                <span className="font-mono font-semibold text-text-primary">#{o.order_number}</span>
                <span className={`rounded-full px-3 py-1 font-mono text-xs font-semibold ${STATUS_COLORS[o.status]}`}>
                  {ORDER_STATUS_LABELS[o.status]}
                </span>
              </div>
              <p className="mt-1 text-sm text-text-muted">
                {new Date(o.created_at).toLocaleDateString()} · {o.items?.length ?? 0} item(s) ·{" "}
                <span className="font-mono text-price">{formatPrice(o.total)}</span>
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ---------------- Orders ---------------- */}
      {tab === "orders" && (
        <div className="space-y-4">
          {orders.length === 0 && (
            <div className="rounded-lg border border-border bg-surface p-10 text-center">
              <p className="text-text-muted">No orders yet.</p>
              <Link href="/shop" className="mt-3 inline-block text-sm font-semibold text-accent-chrome hover:underline">
                Start shopping
              </Link>
            </div>
          )}
          {orders.map((o) => (
            <div key={o.id} className="rounded-lg border border-border bg-surface p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-mono font-bold text-text-primary">
                    #{o.order_number}
                    <span className="ml-3 font-mono text-sm font-normal text-text-muted">
                      {new Date(o.created_at).toLocaleString()}
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-text-muted">
                    {o.payment_method === "credits" ? "Paid with credits" : "WhatsApp order"} ·{" "}
                    <span className="font-mono text-price">{formatPrice(o.total)}</span>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-3 py-1 font-mono text-xs font-semibold ${STATUS_COLORS[o.status]}`}>
                    {ORDER_STATUS_LABELS[o.status]}
                  </span>
                  {o.whatsapp_link && o.status !== "completed" && (
                    <a
                      href={o.whatsapp_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-instock px-3 py-1.5 text-xs font-bold text-white hover:bg-instock/90"
                    >
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>

              {(o.items?.length ?? 0) > 0 && (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="font-mono text-left text-xs uppercase tracking-wider text-text-muted">
                        <th className="pb-2">Item</th>
                        <th className="pb-2">Qty</th>
                        <th className="pb-2">Price</th>
                        <th className="pb-2">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {o.items!.map((it) => (
                        <tr key={it.id}>
                          <td className="py-2.5 text-text-primary">{it.product_name}</td>
                          <td className="py-2.5 text-text-muted">{it.variant_name} × {it.quantity}</td>
                          <td className="py-2.5 font-mono text-text-muted">{formatPrice(it.unit_price)}</td>
                          <td className="py-2.5 font-mono font-semibold text-text-primary">{formatPrice(it.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {(o.delivered_codes?.length ?? 0) > 0 && (
                <div className="mt-4 rounded-xl border border-instock/20 bg-instock/5 p-4">
                  <p className="mb-2 flex items-center gap-2 text-sm font-bold text-instock">
                    <CheckCircle2 className="h-4 w-4" /> Delivered codes
                  </p>
                  <div className="space-y-2">
                    {o.delivered_codes!.map((c, i) => (
                      <div key={i} className="flex items-center justify-between gap-3">
                        <span className="text-sm text-text-muted">
                          {c.product_name} {c.variant_name}
                        </span>
                        <span className="flex items-center gap-2">
                          <code className="rounded-lg bg-bg px-3 py-1 font-mono text-sm text-accent-chrome">
                            {c.code}
                          </code>
                          <button
                            onClick={() => copyCode(c.code)}
                            className="rounded-lg p-1.5 text-text-muted hover:bg-surface hover:text-text-primary"
                            aria-label="Copy code"
                          >
                            {copied === c.code ? (
                              <CheckCircle2 className="h-4 w-4 text-instock" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ---------------- Credits ---------------- */}
      {tab === "credits" && (
        <div className="overflow-hidden rounded-lg border border-border bg-surface">
          <div className="border-b border-border px-6 py-4">
            <p className="font-bold text-text-primary">Credit history</p>
            <p className="text-sm text-text-muted">
              Balance:{" "}
              <span className="font-mono font-semibold text-instock">
                {formatPrice(Number(profile?.credits_balance ?? 0))}
              </span>
            </p>
          </div>
          {transactions.length === 0 ? (
            <p className="p-10 text-center text-text-muted">No credit movements yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {transactions.map((t) => (
                <li key={t.id} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{t.reason || "Credit movement"}</p>
                    <p className="font-mono text-xs text-text-muted">
                      {new Date(t.created_at).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`font-mono font-bold ${Number(t.amount) >= 0 ? "text-instock" : "text-red-400"}`}
                  >
                    {Number(t.amount) >= 0 ? "+" : ""}
                    {formatPrice(Number(t.amount))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ---------------- Profile ---------------- */}
      {tab === "profile" && (
        <>
        <form onSubmit={handleSaveProfile} className="max-w-lg space-y-4 rounded-lg border border-border bg-surface p-6">
          <div>
            <label className="mb-1.5 block text-sm text-text-muted">Full name</label>
            <input
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-text-primary transition focus:border-accent-chrome focus:outline-none focus:ring-2 focus:ring-accent-chrome/15"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-text-muted">Phone</label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-text-primary transition focus:border-accent-chrome focus:outline-none focus:ring-2 focus:ring-accent-chrome/15"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-text-muted">WhatsApp number</label>
            <input
              value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
              className="w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-text-primary transition focus:border-accent-chrome focus:outline-none focus:ring-2 focus:ring-accent-chrome/15"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-text-muted">Country</label>
            <input
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              className="w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-text-primary transition focus:border-accent-chrome focus:outline-none focus:ring-2 focus:ring-accent-chrome/15"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-accent-oxblood px-6 py-2.5 font-semibold text-white transition duration-200 hover:bg-accent-oxblood/90 active:scale-[0.98] disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Changes
          </button>
          {saved && <p className="text-sm text-instock">Profile updated!</p>}
        </form>

        <form
          onSubmit={handleChangePassword}
          className="mt-6 max-w-lg space-y-4 rounded-lg border border-border bg-surface p-6"
        >
          <div>
            <p className="font-bold text-text-primary">Change password</p>
            <p className="text-sm text-text-muted">Enter your current password to update.</p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-text-muted">Current password</label>
            <input
              type="password"
              value={pw.currentPassword}
              onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })}
              className="w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-text-primary transition focus:border-accent-chrome focus:outline-none focus:ring-2 focus:ring-accent-chrome/15"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-text-muted">New password</label>
            <input
              type="password"
              value={pw.password}
              onChange={(e) => setPw({ ...pw, password: e.target.value })}
              className="w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-text-primary transition focus:border-accent-chrome focus:outline-none focus:ring-2 focus:ring-accent-chrome/15"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-text-muted">Confirm new password</label>
            <input
              type="password"
              value={pw.confirm}
              onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
              className="w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-text-primary transition focus:border-accent-chrome focus:outline-none focus:ring-2 focus:ring-accent-chrome/15"
            />
          </div>
          <button
            type="submit"
            disabled={pwSaving}
            className="flex items-center gap-2 rounded-xl bg-accent-oxblood px-6 py-2.5 font-semibold text-white transition duration-200 hover:bg-accent-oxblood/90 active:scale-[0.98] disabled:opacity-60"
          >
            {pwSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            Update Password
          </button>
          {pwMsg && (
            <p className={`text-sm ${pwMsg.ok ? "text-instock" : "text-red-400"}`}>{pwMsg.text}</p>
          )}
        </form>

        <div className="mt-8 max-w-lg rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
          <p className="font-bold text-red-300">Danger zone</p>
          <p className="mt-1 text-sm text-red-400/70">
            Permanently delete your account and personal data. This cannot be undone.
          </p>
          {deleteMsg && <p className="mt-2 text-sm text-red-400">{deleteMsg}</p>}
          <button
            onClick={handleDeleteAccount}
            className="mt-4 rounded-xl border border-red-500/40 px-6 py-2.5 font-semibold text-red-300 hover:bg-red-500/10"
          >
            Delete my account
          </button>
        </div>
        </>
      )}
    </div>
  );
}
