import { requireAdmin, authError } from "@/lib/auth";
import { requireAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Lists every sold code (status = 'assigned') across the store, newest first,
 * with the order it was sold on and the buyer. Used by the admin
 * "Sold Codes" tab so you can audit and clean up test/purchased records.
 */
export async function GET() {
  try {
    await requireAdmin();
    const admin = requireAdminClient();

    const { data, error } = await admin
      .from("codes")
      .select(
        "id, code, status, created_at, order_id, variant:product_variants(name, product:products(id, name, slug, image_url)), order:orders(order_number, customer_email, customer_name, created_at)"
      )
      .eq("status", "assigned")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw error;
    return Response.json({ codes: data ?? [] });
  } catch (e) {
    return authError(e);
  }
}
