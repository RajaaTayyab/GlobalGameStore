"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  ChevronDown,
  ChevronUp,
  Mail,
  Copy,
  CheckCircle2,
} from "lucide-react";
import { formatPrice } from "@/lib/order";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import type { Order } from "@/lib/types";

const STATUS_OPTIONS = ["pending", "paid", "completed", "cancelled"];

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-400",
  paid: "bg-accent-chrome/15 text-accent-chrome",
  completed: "bg-instock/15 text-instock",
  cancelled: "bg-red-500/15 text-red-400",
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const load = () => {
    fetch("/api/admin/orders")
      .then((r) => r.json())
      .then((d) => {
        setOrders(d.orders ?? []);
        setLoading(false);
      });
  };

  useEffect(load, []);

  const setStatus = async (id: string, status: string) => {
    await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  };

  const deliver = async (order: Order) => {
    const codes = prompt(
      `Enter delivered codes for order #${order.order_number} (one per line, "product|variant|code"):`,
      order.items?.map((i) => `${i.product_name}|${i.variant_name}|`).join("\n") ?? ""
    );
    if (codes == null) return;
    const lines = codes
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        const [productName, variantName, ...rest] = l.split("|");
        return { productName: productName ?? order.customer_name ?? "Game", variantName: variantName ?? "Code", code: rest.join("|") || productName || "" };
      })
      .filter((l) => l.code);
    const email = confirm("Email the codes to the customer?") ? (order.customer_email ?? "") : false;

    const res = await fetch(`/api/admin/orders/${order.id}/deliver`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codes: lines, email }),
    });
    const data = await res.json();
    setNotice(
      data.email_sent
        ? "Codes delivered and emailed to the customer"
        : "Codes delivered (email not configured or skipped)"
    );
    setTimeout(() => setNotice(""), 4000);
    load();
  };

  const copy = (text: string) => navigator.clipboard?.writeText(text).catch(() => {});

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-accent-chrome" />
      </div>
    );

  return (
    <div className="space-y-4">
      {notice && (
        <p className="rounded-xl border border-instock/30 bg-instock/10 px-4 py-3 text-sm text-instock">
          {notice}
        </p>
      )}
      {orders.length === 0 && (
        <p className="rounded-lg border border-border bg-surface p-10 text-center text-text-muted">
          No orders yet.
        </p>
      )}
      {orders.map((o) => (
        <div key={o.id} className="rounded-lg border border-border bg-surface">
          <div className="flex flex-wrap items-center gap-3 p-4">
            <button
              onClick={() => setExpanded(expanded === o.id ? null : o.id)}
              className="flex flex-1 items-center gap-3 text-left"
            >
              <div className="min-w-0">
                <p className="font-mono font-bold text-text-primary">
                  #{o.order_number}
                  <span className="ml-2 font-mono text-xs font-normal text-text-muted">
                    {new Date(o.created_at).toLocaleString()}
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-text-muted">
                  {o.customer_name || "Guest"} · {o.payment_method === "credits" ? "Credits" : "WhatsApp"} ·{" "}
                  <span className="font-mono font-semibold text-price">{formatPrice(o.total)}</span>
                  {o.customer_email ? ` · ${o.customer_email}` : ""}
                </p>
              </div>
            </button>

            <span className={`rounded-full px-3 py-1 font-mono text-xs font-semibold ${STATUS_STYLES[o.status]}`}>
              {ORDER_STATUS_LABELS[o.status]}
            </span>

            <select
              value={o.status}
              onChange={(e) => setStatus(o.id, e.target.value)}
              className="rounded-lg border border-border bg-bg px-2.5 py-1.5 font-mono text-xs text-text-primary focus:border-accent-chrome focus:outline-none"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {ORDER_STATUS_LABELS[s]}
                </option>
              ))}
            </select>

            {o.payment_method === "whatsapp" && (
              <button
                onClick={() => deliver(o)}
                className="flex items-center gap-1.5 rounded-lg bg-instock px-3 py-1.5 text-xs font-bold text-white transition duration-200 hover:bg-instock/90 active:scale-[0.97]"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Deliver Codes
              </button>
            )}
            {expanded === o.id ? <ChevronUp className="h-5 w-5 text-text-muted" /> : <ChevronDown className="h-5 w-5 text-text-muted" />}
          </div>

          {expanded === o.id && (
            <div className="space-y-4 border-t border-border p-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="font-mono text-left text-xs uppercase tracking-wider text-text-muted">
                      <th className="pb-2">Product</th>
                      <th className="pb-2">Variant</th>
                      <th className="pb-2">Qty</th>
                      <th className="pb-2">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {o.items?.map((i) => (
                      <tr key={i.id}>
                        <td className="py-2.5 text-text-primary">{i.product_name}</td>
                        <td className="py-2.5 text-text-muted">{i.variant_name}</td>
                        <td className="py-2.5 text-text-muted">{i.quantity}</td>
                        <td className="py-2.5 font-mono font-semibold text-text-primary">{formatPrice(i.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {(o.delivered_codes?.length ?? 0) > 0 && (
                <div className="rounded-xl border border-instock/20 bg-instock/5 p-4">
                  <p className="mb-2 flex items-center gap-2 text-sm font-bold text-instock">
                    <Mail className="h-4 w-4" /> Delivered codes ({o.delivered_codes!.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {o.delivered_codes!.map((c, i) => (
                      <button
                        key={i}
                        onClick={() => copy(c.code)}
                        className="flex items-center gap-2 rounded-lg bg-bg px-3 py-1.5 font-mono text-sm text-accent-chrome hover:border hover:border-accent-chrome/30"
                        title="Click to copy"
                      >
                        {c.code} <Copy className="h-3.5 w-3.5 text-text-muted" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {o.whatsapp_link && (
                <a
                  href={o.whatsapp_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-sm text-instock hover:underline"
                >
                  Open prefilled WhatsApp message ↗
                </a>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
