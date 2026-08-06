import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COUNTRY_TO_REGION } from "@/lib/constants";
import { REGION_COOKIE, isValidRegion } from "@/lib/region";

/**
 * Geo-route by the visitor's IP country (Vercel sets `x-vercel-ip-country`).
 * Maps the country to a region and persists it in a cookie so the server can
 * render the region-specific experience (hero, recommendations) before
 * hydration. A user's manual override is respected by leaving the cookie alone.
 */
export function proxy(request: NextRequest) {
  const existing = request.cookies.get(REGION_COOKIE)?.value;
  if (isValidRegion(existing)) {
    return NextResponse.next();
  }

  const country = request.headers.get("x-vercel-ip-country");
  const region = country ? COUNTRY_TO_REGION[country] : undefined;
  if (!region) {
    return NextResponse.next();
  }

  const res = NextResponse.next();
  res.cookies.set(REGION_COOKIE, region, {
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
  });
  return res;
}

export const config = {
  matcher:
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
};
