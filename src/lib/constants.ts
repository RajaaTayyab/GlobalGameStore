import type { RegionCode } from "./types";

export const STORE_NAME = "GlobalGameStore";

export const REGION_LABELS: Record<RegionCode, string> = {
  pk: "Pakistan",
  mena: "Middle East",
  us: "USA",
  global: "Global",
};

/** ISO country code -> region code */
export const COUNTRY_TO_REGION: Record<string, RegionCode> = {
  // Pakistan
  PK: "pk",
  // Middle East
  AE: "mena", SA: "mena", QA: "mena", KW: "mena", BH: "mena", OM: "mena",
  IQ: "mena", JO: "mena", LB: "mena", EG: "mena", SY: "mena", YE: "mena", PS: "mena",
  // USA
  US: "us",
};

export const REGION_COUNTRIES: Record<RegionCode, string[]> = {
  pk: ["PK"],
  mena: ["AE", "SA", "QA", "KW", "BH", "OM", "IQ", "JO", "LB", "EG", "SY", "YE", "PS"],
  us: ["US"],
  global: [],
};

export const REGION_ORDER: RegionCode[] = ["pk", "mena", "us"];

export const CURRENCY = "$";

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
