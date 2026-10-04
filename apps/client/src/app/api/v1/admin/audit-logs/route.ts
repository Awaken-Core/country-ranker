import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { adminRepository } from "@/modules/admin/admin.repository";
import { adminService } from "@/modules/admin/admin.service";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

    const authCheck = await adminService.verifyAccess(session.user.id, "AUDIT_LOGS_VIEW");
    if (!authCheck.authorized) return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });

    const url = new URL(request.url);
    const search = url.searchParams.get("search") || undefined;
    const page = Number(url.searchParams.get("page") || 1);
    const limit = Number(url.searchParams.get("limit") || 50);

    const result = await adminRepository.getAuditLogs({
      search,
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to fetch audit logs:", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}
