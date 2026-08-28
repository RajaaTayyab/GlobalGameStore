import { requireAdmin, authError } from "@/lib/auth";
import { requireAdminClient } from "@/lib/supabase/admin";
import { revalidateTag } from "next/cache";

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
        sold_out: !!body.sold_out,
        price_on_request: !!body.price_on_request,
      })
      .select()
      .single();

    if (error) {
      console.error("create variant error:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }
    revalidateTag("catalog", { expire: 0 });
    return Response.json({ variant: data });
  } catch (e) {
    return authError(e);
  }
}