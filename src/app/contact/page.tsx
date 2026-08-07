import type { Metadata } from "next";
import { Mail, Globe } from "lucide-react";
import ContactWhatsApp from "@/components/ContactWhatsApp";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with GlobalGameStore support 24/7.",
};

export default async function ContactPage() {
  let storePhone = process.env.WHATSAPP_NUMBER || "15551234567";
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data: setting } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "whatsapp_number")
      .maybeSingle();
    if (setting?.value) storePhone = setting.value as string;
  } catch (e) {
    console.error("contact: Supabase not configured:", e);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="text-center">
        <h1 className="font-serif text-3xl font-bold text-text-primary">Contact Us</h1>
        <p className="mt-2 text-text-muted">
          Questions about an order? Our team replies 24/7 on WhatsApp.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <ContactWhatsApp phone={storePhone} />
        <div className="rounded-lg border border-border bg-surface p-6 text-center transition duration-300 hover:-translate-y-1 hover:border-accent-chrome/40">
          <Mail className="mx-auto h-6 w-6 text-accent-chrome" />
          <p className="mt-3 font-semibold text-text-primary">Email</p>
          <p className="mt-1 font-mono text-sm text-text-muted">support@globalgamestore.com</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-6 text-center transition duration-300 hover:-translate-y-1 hover:border-accent-chrome/40">
          <Globe className="mx-auto h-6 w-6 text-accent-chrome" />
          <p className="mt-3 font-semibold text-text-primary">Digital only</p>
          <p className="mt-1 text-sm text-text-muted">No shipping — everything delivers online</p>
        </div>
      </div>

      <div className="mt-10 rounded-lg border border-border bg-surface p-6">
        <h2 className="mb-3 font-serif font-bold text-text-primary">WhatsApp order flow</h2>
        <ol className="list-inside list-decimal space-y-2 text-sm text-text-muted">
          <li>Add products to your cart.</li>
          <li>Checkout and choose &quot;Order via WhatsApp&quot;.</li>
          <li>Send the prefilled order summary to our WhatsApp number.</li>
          <li>Pay as agreed, and receive your codes instantly.</li>
        </ol>
      </div>
    </div>
  );
}