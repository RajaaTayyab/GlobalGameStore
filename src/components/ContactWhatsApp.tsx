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
      className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center transition hover:border-emerald-500/50"
    >
      <MessageCircle className="mx-auto h-6 w-6 text-emerald-400" />
      <p className="mt-3 font-semibold text-white">WhatsApp</p>
      <p className="mt-1 text-sm text-slate-400">Chat with support now</p>
    </a>
  );
}
