import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { adminRepository } from "@/modules/admin/admin.repository";
import { adminService } from "@/modules/admin/admin.service";
import { AdminPermission, UserRole } from "@/modules/admin/admin.types";
import { getClientIp } from "@/lib/rate-limit/ip";
import { checkRateLimit, maskIdentifier } from "@/lib/rate-limit/limiters";
import { createRateLimitResponse } from "@/lib/rate-limit/response";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user)
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

    const authCheck = await adminService.verifyAccess(session.user.id);
    if (!authCheck.authorized)
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status },
      );

    const url = new URL(request.url);
    const search = url.searchParams.get("search") || undefined;
    const role = (url.searchParams.get("role") as UserRole) || undefined;
    const page = Number(url.searchParams.get("page") || 1);
    const limit = Number(url.searchParams.get("limit") || 50);

    const result = await adminRepository.getAllUsers({
      search,
      role,
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to fetch admin users:", error);
    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
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
        "Too many admin management requests submitted. Please wait a minute.",
      );
    }

    const body = await request.json();
    const { action, targetUserId, permissions } = body as {
      action: "CREATE_ADMIN" | "REMOVE_ADMIN" | "SET_PERMISSIONS";
      targetUserId: string;
      permissions?: AdminPermission[];
    };

    if (!targetUserId || !action) {
      return NextResponse.json(
        { error: "MISSING_REQUIRED_FIELDS" },
        { status: 400 },
      );
    }

    if (action === "CREATE_ADMIN") {
      const res = await adminService.createAdmin(
        session.user.id,
        targetUserId,
        permissions || [],
      );
      return NextResponse.json({ success: true, data: res });
    }

    if (action === "REMOVE_ADMIN") {
      const res = await adminService.removeAdmin(session.user.id, targetUserId);
      return NextResponse.json({ success: true, data: res });
    }

    if (action === "SET_PERMISSIONS") {
      const res = await adminService.setPermissions(
        session.user.id,
        targetUserId,
        permissions || [],
      );
      return NextResponse.json({ success: true, data: res });
    }

    return NextResponse.json({ error: "INVALID_ACTION" }, { status: 400 });
  } catch (error: any) {
    console.error("Admin user action error:", error);
    return NextResponse.json(
      { error: error.message || "INTERNAL_SERVER_ERROR" },
      { status: 400 },
    );
  }
}
