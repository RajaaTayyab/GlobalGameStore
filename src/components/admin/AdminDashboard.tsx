"use client";

import { useEffect, useState } from "react";
import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  AlertTriangle,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { formatPrice } from "@/lib/order";

interface Stats {
  revenue: number;
  orders_count: number;
  pending_orders: number;
  users_count: number;
  products_count: number;
  low_stock: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [lowStock, setLowStock] = useState<{ id: string; name: string; product: { name: string } }[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((d) => {
        if (d.stats) {
          setStats(d.stats);
          setLowStock(d.low_stock_products ?? []);
        } else setError(d.error ?? "Failed to load");
      })
      .catch(() => setError("Failed to load"));
  }, []);

  if (error) return <p className="text-red-400">{error}</p>;
  if (!stats)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );

  const cards = [
    { label: "Revenue (paid)", value: formatPrice(stats.revenue), icon: DollarSign, color: "text-emerald-400" },
    { label: "Total orders", value: String(stats.orders_count), icon: ShoppingCart, color: "text-cyan-400" },
    { label: "Pending orders", value: String(stats.pending_orders), icon: AlertTriangle, color: "text-amber-400" },
    { label: "Registered users", value: String(stats.users_count), icon: Users, color: "text-blue-400" },
    { label: "Products", value: String(stats.products_count), icon: Package, color: "text-purple-400" },
    { label: "Out-of-stock variants", value: String(stats.low_stock), icon: AlertTriangle, color: "text-red-400" },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">{c.label}</p>
              <c.icon className={`h-5 w-5 ${c.color}`} />
            </div>
            <p className="mt-2 text-2xl font-bold text-white">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="mb-4 flex items-center gap-2 font-bold text-white">
          <AlertTriangle className="h-5 w-5 text-amber-400" />
          Variants with no code stock
        </h2>
        {lowStock.length === 0 ? (
          <p className="text-sm text-slate-400">All variants have available codes. Great job!</p>
        ) : (
          <ul className="divide-y divide-slate-800">
            {lowStock.map((v) => (
              <li key={v.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-slate-200">
                  {v.product?.name} <span className="text-slate-500">/ {v.name}</span>
                </span>
                <span className="rounded-full bg-red-500/15 px-3 py-1 text-xs font-semibold text-red-400">
                  No stock
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 flex items-center gap-1 text-xs text-slate-500">
          Add codes in the Products tab <ArrowRight className="h-3 w-3" />
        </p>
      </div>
    </div>
  );
}
