"use client";

import { useEffect, useState } from "react";
import {
  Coins,
  ShoppingCart,
  Users,
  Package,
  AlertTriangle,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { formatPrice } from "@/lib/order";
import TiltCard from "@/components/TiltCard";

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
        <Loader2 className="h-8 w-8 animate-spin text-accent-chrome" />
      </div>
    );

  const cards = [
    { label: "Revenue (paid)", value: formatPrice(stats.revenue), icon: Coins, color: "text-instock" },
    { label: "Total orders", value: String(stats.orders_count), icon: ShoppingCart, color: "text-accent-chrome" },
    { label: "Pending orders", value: String(stats.pending_orders), icon: AlertTriangle, color: "text-amber-400" },
    { label: "Registered users", value: String(stats.users_count), icon: Users, color: "text-accent-chrome" },
    { label: "Products", value: String(stats.products_count), icon: Package, color: "text-accent-chrome" },
    { label: "Out-of-stock variants", value: String(stats.low_stock), icon: AlertTriangle, color: "text-red-400" },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <TiltCard key={c.label} intensity={3} scale={1.015} glare={false}>
            <div className="rounded-lg border border-border bg-surface p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-text-muted">{c.label}</p>
                <c.icon className={`h-5 w-5 ${c.color}`} />
              </div>
              <p className="mt-2 font-mono text-2xl font-bold text-text-primary">{c.value}</p>
            </div>
          </TiltCard>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-surface p-6">
        <h2 className="mb-4 flex items-center gap-2 font-bold text-text-primary">
          <AlertTriangle className="h-5 w-5 text-amber-400" />
          Variants with no code stock
        </h2>
        {lowStock.length === 0 ? (
          <p className="text-sm text-text-muted">All variants have available codes. Great job!</p>
        ) : (
          <ul className="divide-y divide-border">
            {lowStock.map((v) => (
              <li key={v.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-text-primary">
                  {v.product?.name} <span className="text-text-muted">/ {v.name}</span>
                </span>
                <span className="rounded-full bg-red-500/15 px-3 py-1 text-xs font-semibold text-red-400">
                  No stock
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 flex items-center gap-1 text-xs text-text-muted">
          Add codes in the Products tab <ArrowRight className="h-3 w-3" />
        </p>
      </div>
    </div>
  );
}
