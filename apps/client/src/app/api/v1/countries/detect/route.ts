import { NextRequest, NextResponse } from "next/server";
import { getClientIp } from "@/lib/rate-limit/ip";

export async function GET(request: NextRequest) {
  try {
    // 1. Check direct geo headers provided by edge / reverse proxy / CDNs
    const headerCountry =
      request.headers.get("x-vercel-ip-country") ||
      request.headers.get("cf-ipcountry") ||
      request.headers.get("x-country-code") ||
      request.headers.get("cloudfront-viewer-country") ||
      request.headers.get("fastly-client-country");

    if (headerCountry && headerCountry !== "XX" && headerCountry !== "T1") {
      const code = headerCountry.trim().toUpperCase();
      if (/^[A-Z]{2}$/.test(code)) {
        return NextResponse.json({
          countryCode: code,
          source: "header",
        });
      }
    }

    // 2. Client IP lookup
    const clientIp = getClientIp(request);

    // If on localhost / private network during development, detect using public IP lookup
    const isLocalDev =
      !clientIp ||
      clientIp === "127.0.0.1" ||
      clientIp === "::1" ||
      clientIp.startsWith("192.168.") ||
      clientIp.startsWith("10.") ||
      clientIp.startsWith("172.16.");

    const targetUrl = isLocalDev
      ? "https://ipapi.co/json/"
      : `https://ipapi.co/${clientIp}/country/`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    try {
      const geoRes = await fetch(targetUrl, {
        signal: controller.signal,
        headers: { "User-Agent": "CountryRanker/1.0" },
      });
      clearTimeout(timeoutId);

      if (geoRes.ok) {
        if (isLocalDev) {
          const data = (await geoRes.json().catch(() => null)) as { country_code?: string } | null;
          if (data?.country_code && /^[A-Z]{2}$/.test(data.country_code)) {
            return NextResponse.json({
              countryCode: data.country_code.toUpperCase(),
              source: "ipapi_dev",
            });
          }
        } else {
          const text = (await geoRes.text()).trim().toUpperCase();
          if (/^[A-Z]{2}$/.test(text) && text !== "UNDEFINED") {
            return NextResponse.json({
              countryCode: text,
              source: "ipapi",
            });
          }
        }
      }
    } catch {
      clearTimeout(timeoutId);
    }

    return NextResponse.json({
      countryCode: null,
      source: "unknown",
    });
  } catch (error) {
    console.error("GET /api/v1/countries/detect error:", error);
    return NextResponse.json(
      { countryCode: null, error: "Detection failed" },
      { status: 500 },
    );
  }
}
