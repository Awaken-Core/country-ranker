import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { adminService } from "@/modules/admin/admin.service";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

    const { id } = await context.params;
    const body = await request.json();
    const { name, flag } = body as { name?: string; flag?: string };

    const result = await adminService.editCountry(session.user.id, id, { name, flag });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Failed to edit country:", error);
    return NextResponse.json({ error: error.message || "INTERNAL_SERVER_ERROR" }, { status: 400 });
  }
}
