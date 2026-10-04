import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { adminService } from "@/modules/admin/admin.service";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const context = await adminService.getAdminContext(session.user.id);
    if (!context || (context.role !== "ADMIN" && context.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    return NextResponse.json(context, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Failed to get admin session:", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}
