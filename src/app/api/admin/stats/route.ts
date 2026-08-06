import { requireAdmin, authError } from "@/lib/auth";
import { requireAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
    const admin = requireAdminClient();

    const [ordersRes, usersRes, productsRes, pendingRes] = await Promise.all([
      admin
        .from("orders")
        .select("total, payment_method, status", { count: "exact" })
        .in("status", ["paid", "completed"]),
      admin.from("profiles").select("id, role", { count: "exact" }),
      admin.from("products").select("id", { count: "exact" }),
      admin.from("orders").select("id", { count: "exact" }).eq("status", "pending"),
    ]);

    const revenue = (ordersRes.data ?? []).reduce(
      (s: number, o: { total: number }) => s + Number(o.total ?? 0),
      0
    );

    // Low stock: variants with no available codes
    const { data: variantCodes } = await admin
      .from("codes")
      .select("variant_id, status");
    const availableByVariant: Record<string, number> = {};
    for (const row of variantCodes ?? []) {
      if (row.status === "available") {
        availableByVariant[row.variant_id] = (availableByVariant[row.variant_id] ?? 0) + 1;
      }
    }
    const { data: variants } = await admin
      .from("product_variants")
      .select("id, name, product:products(name)")
      .eq("active", true);
    const lowStock = (variants ?? []).filter(
      (v: { id: string }) => (availableByVariant[v.id] ?? 0) === 0
    );

    return Response.json({
      stats: {
        revenue,
        orders_count: ordersRes.count ?? 0,
        pending_orders: pendingRes.count ?? 0,
        users_count: usersRes.count ?? 0,
        products_count: productsRes.count ?? 0,
        low_stock: lowStock.length,
      },
      low_stock_products: lowStock.slice(0, 10),
    });
  } catch (e) {
    return authError(e);
  }
}
