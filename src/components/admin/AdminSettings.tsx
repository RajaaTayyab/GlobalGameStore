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
    "w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-text-primary focus:border-accent-chrome focus:outline-none";

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-accent-chrome" />
      </div>
    );

  return (
    <form onSubmit={save} className="max-w-lg space-y-5">
      {notice && (
        <p className="rounded-xl border border-instock/30 bg-instock/10 px-4 py-3 text-sm text-instock">
          {notice}
        </p>
      )}
      <div className="rounded-lg border border-border bg-surface p-6">
        <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-text-primary">
          <MessageCircle className="h-4 w-4 text-instock" />
          WhatsApp number for orders
        </label>
        <input
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          placeholder="15551234567"
          className={inputCls}
        />
        <p className="mt-1.5 text-xs text-text-muted">
          Guest carts send their order to this number via wa.me. Digits only, with country code
          (no + or spaces).
        </p>
      </div>

      <div className="rounded-lg border border-border bg-surface p-6">
        <label className="mb-1.5 block text-sm font-medium text-text-primary">Store name</label>
        <input
          value={storeName}
          onChange={(e) => setStoreName(e.target.value)}
          placeholder="GlobalGameStore"
          className={inputCls}
        />
        <p className="mt-1.5 text-xs text-text-muted">
          Used in order emails and WhatsApp messages.
        </p>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="flex items-center gap-2 rounded-xl bg-accent-oxblood px-6 py-2.5 font-bold text-white hover:bg-accent-oxblood/90 disabled:opacity-60"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Save Settings
      </button>
    </form>
  );
}
