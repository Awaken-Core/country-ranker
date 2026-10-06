import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { adminService } from "@/modules/admin/admin.service";
import { getClientIp } from "@/lib/rate-limit/ip";
import { checkRateLimit, maskIdentifier } from "@/lib/rate-limit/limiters";
import { createRateLimitResponse } from "@/lib/rate-limit/response";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    // 1. Admin mutation IP safeguard (20 req/min/IP)
    const clientIp = getClientIp(request);
    const ipCheck = await checkRateLimit("admin_ip", clientIp);
    if (!ipCheck.success) {
      console.warn(
        `[RateLimit Blocked] Admin mutation IP limit exceeded for IP: ${maskIdentifier(clientIp)}`,
      );
      return createRateLimitResponse(
        ipCheck,
        "Too many admin requests from this IP. Please wait a minute.",
      );
    }

    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user)
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

    // 2. Admin User rate limit (10 mutations/min/admin user)
    const adminCheck = await checkRateLimit("admin_user", session.user.id);
    if (!adminCheck.success) {
      console.warn(
        `[RateLimit Blocked] Admin mutation User limit exceeded for User: ${maskIdentifier(session.user.id)}`,
      );
      return createRateLimitResponse(
        adminCheck,
        "Too many country updates submitted. Please wait a minute.",
      );
    }

    const { id } = await context.params;
    const body = await request.json();
    const { name, flag } = body as { name?: string; flag?: string };

    const result = await adminService.editCountry(session.user.id, id, {
      name,
      flag,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Failed to edit country:", error);
    return NextResponse.json(
      { error: error.message || "INTERNAL_SERVER_ERROR" },
      { status: 400 },
    );
  }
}
