"use client";

import { MessageCircle } from "lucide-react";
import { buildWhatsAppLink } from "@/lib/order";

export default function ContactWhatsApp({ phone }: { phone: string }) {
  const link = buildWhatsAppLink(
    phone,
    "Hello! I have a question about GlobalGameStore."
  );
  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-2xl border border-border bg-surface p-6 text-center transition duration-300 hover:-translate-y-1 hover:border-instock/50 hover:shadow-lg hover:shadow-instock/10"
    >
      <MessageCircle className="mx-auto h-6 w-6 text-instock" />
      <p className="mt-3 font-semibold text-text-primary">WhatsApp</p>
      <p className="mt-1 text-sm text-text-muted">Chat with support now</p>
    </a>
  );
}
