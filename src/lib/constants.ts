import type { RegionCode } from "./types";

export const STORE_NAME = "GlobalGameStore";

export const REGION_LABELS: Record<RegionCode, string> = {
  pk: "Pakistan",
  us: "USA",
  sa: "Saudi Arabia",
  ae: "UAE",
  kw: "Kuwait",
  global: "Global",
};

/**
 * ISO country code -> region code.
 * SA / AE / KW get their own precise region (for country-locked catalog items
 * like Netflix KSA, PSN UAE, etc.). Any country without a mapping (including
 * the rest of the Middle East, Europe, etc.) falls back to "global".
 */
export const COUNTRY_TO_REGION: Record<string, RegionCode> = {
  // Pakistan
  PK: "pk",
  // Precise Gulf regions
  SA: "sa",
  AE: "ae",
  KW: "kw",
  // USA
  US: "us",
};

export const REGION_COUNTRIES: Record<RegionCode, string[]> = {
  pk: ["PK"],
  us: ["US"],
  sa: ["SA"],
  ae: ["AE"],
  kw: ["KW"],
  global: [],
};

export const REGION_ORDER: RegionCode[] = ["pk", "us", "sa", "ae", "kw"];

export const CURRENCY = "USDT";

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  paid: "Paid",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  credits: "Credits",
  whatsapp: "WhatsApp",
};
