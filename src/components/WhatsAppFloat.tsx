"use client";

import { MessageCircle } from "lucide-react";
import { buildWhatsAppLink } from "@/lib/order";

export default function WhatsAppFloat({ phone }: { phone: string }) {
  if (!phone) return null;
  const href = buildWhatsAppLink(phone, "Hello! I have a question about your products.");
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-instock text-white shadow-lg transition duration-200 hover:scale-105 hover:glow-instock active:scale-95"
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
}
