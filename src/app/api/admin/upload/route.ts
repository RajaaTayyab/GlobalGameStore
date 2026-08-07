import { requireAdmin, authError } from "@/lib/auth";
import { requireAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const BUCKET = "product-images";
const MAX_SIZE = 5 * 1024 * 1024;

const EXT_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const admin = requireAdminClient();

    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }
    const ext = EXT_BY_MIME[file.type];
    if (!ext) {
      return Response.json(
        { error: "Only PNG, JPG, WebP, GIF or AVIF images are allowed" },
        { status: 400 }
      );
    }
    if (file.size > MAX_SIZE) {
      return Response.json({ error: "Image must be under 5 MB" }, { status: 400 });
    }

    const { data: buckets } = await admin.storage.listBuckets();
    if (!(buckets ?? []).some((b) => b.name === BUCKET)) {
      await admin.storage.createBucket(BUCKET, { public: true });
    }

    const name = `${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await admin.storage.from(BUCKET).upload(
      name,
      await file.arrayBuffer(),
      { contentType: file.type, cacheControl: "3600", upsert: false }
    );
    if (uploadError) {
      console.error("upload error:", uploadError);
      return Response.json({ error: "Could not upload image" }, { status: 500 });
    }

    const { data } = admin.storage.from(BUCKET).getPublicUrl(name);
    return Response.json({ url: data.publicUrl });
  } catch (e) {
    return authError(e);
  }
}
