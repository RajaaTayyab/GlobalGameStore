import { requireAdmin, authError } from "@/lib/auth";
import { requireAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
    const admin = requireAdminClient();

    const { data: categories, error } = await admin
      .from("categories")
      .select("*, products:products(count)")
      .order("sort_order");
    if (error) throw error;

    return Response.json({
      categories: (categories ?? []).map((c) => ({
        ...c,
        product_count: c.products?.[0]?.count ?? 0,
      })),
    });
  } catch (e) {
    return authError(e);
  }
}
