import { requireAdmin, authError } from "@/lib/auth";
import { requireAdminClient } from "@/lib/supabase/admin";
import { revalidateTag } from "next/cache";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(_req: Request, ctx: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await ctx.params;
    const admin = requireAdminClient();

    // Look up the code first so we can also scrub its mirror in order_codes
    // and tell the caller whether it was tied to a customer order.
    const { data: row, error: lookupErr } = await admin
      .from("codes")
      .select("id, code, status, order_id")
      .eq("id", id)
      .maybeSingle();
    if (lookupErr) {
      console.error("delete code lookup error:", lookupErr);
      return Response.json(
        { error: `Could not delete code: ${lookupErr.message}` },
        { status: 500 }
      );
    }
    if (!row) {
      return Response.json({ error: "Code not found" }, { status: 404 });
    }

    // Scrub the denormalised mirror on order_codes so the code also
    // disappears from the customer's order record (and admin order view).
    await admin.from("order_codes").delete().eq("code", row.code);

    const { error, count } = await admin
      .from("codes")
      .delete({ count: "exact" })
      .eq("id", id);
    if (error) {
      console.error("delete code error:", error);
      return Response.json(
        { error: `Could not delete code: ${error.message}` },
        { status: 500 }
      );
    }
    if (!count) {
      return Response.json({ error: "Code not found" }, { status: 404 });
    }
    revalidateTag("catalog", { expire: 0 });
    revalidateTag("stock", { expire: 0 });
    return Response.json({
      ok: true,
      deleted: count,
      was_sold: row.status === "assigned",
      order_id: row.order_id,
    });
  } catch (e) {
    return authError(e);
  }
}
