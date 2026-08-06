import { cookies } from "next/headers";
import type { RegionCode } from "@/lib/types";

const REGION_CODES: RegionCode[] = ["pk", "mena", "us", "global"];
export const REGION_COOKIE = "gts-region";

/** Reads the region cookie set by the proxy from the visitor's IP country. */
export async function getRegionFromCookie(): Promise<RegionCode | null> {
  const store = await cookies();
  const val = store.get(REGION_COOKIE)?.value as RegionCode | undefined;
  return val && REGION_CODES.includes(val) ? val : null;
}

export function isValidRegion(value: string | undefined): value is RegionCode {
  return value !== undefined && REGION_CODES.includes(value as RegionCode);
}
