import type { RegionCode } from "./types";

export const STORE_NAME = "GlobalGameStore";

export const REGION_LABELS: Record<RegionCode, string> = {
  pk: "Pakistan",
  mena: "Middle East",
  us: "USA",
  sa: "Saudi Arabia",
  ae: "UAE",
  kw: "Kuwait",
  global: "Global",
};

/**
 * ISO country code -> region code.
 * SA / AE / KW get their own precise region (for country-locked catalog items
 * like Netflix KSA, PSN UAE, etc.) instead of falling into the generic "mena"
 * bucket. Other Middle-East countries still map to "mena" for the general
 * regional experience.
 */
export const COUNTRY_TO_REGION: Record<string, RegionCode> = {
  // Pakistan
  PK: "pk",
  // Precise Gulf regions
  SA: "sa",
  AE: "ae",
  KW: "kw",
  // Rest of Middle East
  QA: "mena", BH: "mena", OM: "mena",
  IQ: "mena", JO: "mena", LB: "mena", EG: "mena", SY: "mena", YE: "mena", PS: "mena",
  // USA
  US: "us",
};

export const REGION_COUNTRIES: Record<RegionCode, string[]> = {
  pk: ["PK"],
  mena: ["QA", "BH", "OM", "IQ", "JO", "LB", "EG", "SY", "YE", "PS"],
  us: ["US"],
  sa: ["SA"],
  ae: ["AE"],
  kw: ["KW"],
  global: [],
};

export const REGION_ORDER: RegionCode[] = ["pk", "mena", "us", "sa", "ae", "kw"];

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
