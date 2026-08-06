import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COUNTRY_TO_REGION } from "@/lib/constants";
import { REGION_COOKIE } from "@/lib/region";

/**
 * Geo-route by the visitor's IP country (Vercel sets `x-vercel-ip-country`).
 * The region is re-evaluated on every request so it always follows the current
 * IP — e.g. when a visitor connects via a VPN in another country, the region
 * (and the hero/recommendations) update accordingly.
 */
export function proxy(request: NextRequest) {
  const country = request.headers.get("x-vercel-ip-country");
  const region = country ? COUNTRY_TO_REGION[country] : undefined;

  // No usable country header (e.g. local dev): leave existing cookie or nothing.
  if (!region) {
    return NextResponse.next();
  }

  const existing = request.cookies.get(REGION_COOKIE)?.value;
  const res = NextResponse.next();
  if (existing !== region) {
    res.cookies.set(REGION_COOKIE, region, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
    });
  }
  return res;
}

export const config = {
  matcher:
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
};
