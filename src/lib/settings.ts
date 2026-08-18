import { createClient } from "@/lib/supabase/server";

/** Resolve the store's WhatsApp number: DB setting first, then env fallback. */
export async function getWhatsappNumber(): Promise<string> {
  let phone = process.env.WHATSAPP_NUMBER || "15551234567";
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "whatsapp_number")
      .maybeSingle();
    if (data?.value) phone = data.value as string;
  } catch {
    // Supabase not configured in this environment — keep env fallback.
  }
  return phone;
}
