"use client";

import { useEffect, useState } from "react";
import { Loader2, MessageCircle, Save } from "lucide-react";

export default function AdminSettings() {
  const [whatsapp, setWhatsapp] = useState("");
  const [storeName, setStoreName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) {
          setWhatsapp(d.settings.whatsapp_number ?? "");
          setStoreName(d.settings.store_name ?? "");
        }
        setLoading(false);
      });
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ whatsapp_number: whatsapp, store_name: storeName }),
    });
    await res.json();
    setSaving(false);
    setNotice("Settings saved");
    setTimeout(() => setNotice(""), 3000);
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
    <form onSubmit={save} className="max-w-lg space-y-5">
      {notice && (
        <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
          {notice}
        </p>
      )}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-300">
          <MessageCircle className="h-4 w-4 text-emerald-400" />
          WhatsApp number for orders
        </label>
        <input
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          placeholder="15551234567"
          className={inputCls}
        />
        <p className="mt-1.5 text-xs text-slate-500">
          Guest carts send their order to this number via wa.me. Digits only, with country code
          (no + or spaces).
        </p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <label className="mb-1.5 block text-sm font-medium text-slate-300">Store name</label>
        <input
          value={storeName}
          onChange={(e) => setStoreName(e.target.value)}
          placeholder="GlobalGameStore"
          className={inputCls}
        />
        <p className="mt-1.5 text-xs text-slate-500">
          Used in order emails and WhatsApp messages.
        </p>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="flex items-center gap-2 rounded-xl bg-cyan-500 px-6 py-2.5 font-bold text-slate-950 hover:bg-cyan-400 disabled:opacity-60"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Save Settings
      </button>
    </form>
  );
}
