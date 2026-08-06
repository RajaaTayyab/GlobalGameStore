import { requireAdmin, authError } from "@/lib/auth";
import { requireAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const admin = requireAdminClient();
    const body = await req.json();

    if (!body.product_id || !body.name || body.price == null) {
      return Response.json(
        { error: "product_id, name and price are required" },
        { status: 400 }
      );
    }

    const { data, error } = await admin
      .from("product_variants")
      .insert({
        product_id: body.product_id,
        name: body.name,
        price: Number(body.price),
        original_price: body.original_price != null ? Number(body.original_price) : null,
      })
      .select()
      .single();

    if (error) throw error;
    return Response.json({ variant: data });
  } catch (e) {
    return authError(e);
  }
}
