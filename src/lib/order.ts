import { STORE_NAME, CURRENCY } from "./constants";
import type { CartItem } from "./types";

export function formatPrice(n: number): string {
  return `${n.toFixed(2)} ${CURRENCY}`;
}

export function generateOrderNumber(): string {
  const now = new Date();
  const y = now.getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `GGS-${y}-${rand}`;
}

export function cartTotal(items: { unitPrice: number; quantity: number }[]): number {
  return items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
}

export function buildOrderSummaryText(items: CartItem[]): string {
  const lines = items.map(
    (i) => `- ${i.productName} (${i.variantName}) x${i.quantity} = ${formatPrice(i.unitPrice * i.quantity)}`
  );
  return lines.join("\n");
}

export function buildWhatsAppLink(phone: string, message: string): string {
  const clean = phone.replace(/\D/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

/** Message the store owner receives for a guest (WhatsApp) order. */
export function buildWhatsAppOrderMessage(opts: {
  orderNumber: string;
  items: CartItem[];
  total: number;
  customerName: string;
  customerEmail: string;
  customerWhatsapp: string;
  country?: string;
}): string {
  const lines = opts.items.map(
    (i) => `${i.productName} - ${i.variantName} x${i.quantity} = ${formatPrice(i.unitPrice * i.quantity)}`
  );
  return [
    `Hello ${STORE_NAME}!`,
    `I would like to place an order (#${opts.orderNumber}):`,
    ``,
    ...lines,
    ``,
    `Total: ${formatPrice(opts.total)}`,
    ``,
    `Name: ${opts.customerName}`,
    opts.customerEmail ? `Email: ${opts.customerEmail}` : null,
    opts.customerWhatsapp ? `WhatsApp: ${opts.customerWhatsapp}` : null,
    opts.country ? `Country: ${opts.country}` : null,
  ]
    .filter((l): l is string => l !== null)
    .join("\n");
}

export function cleanWhatsAppNumber(phone: string): string {
  return phone.replace(/[^0-9]/g, "");
}
