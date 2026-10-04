import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { adminRepository } from "@/modules/admin/admin.repository";
import { adminService } from "@/modules/admin/admin.service";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

    const authCheck = await adminService.verifyAccess(session.user.id, "VOTES_VIEW");
    if (!authCheck.authorized) return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });

    const url = new URL(request.url);
    const search = url.searchParams.get("search") || undefined;
    const voteType = (url.searchParams.get("voteType") as "UPVOTE" | "DOWNVOTE") || undefined;
    const source = (url.searchParams.get("source") as "FREE" | "PURCHASED") || undefined;
    const page = Number(url.searchParams.get("page") || 1);
    const limit = Number(url.searchParams.get("limit") || 50);

    const result = await adminRepository.getVoteLogs({
      search,
      voteType,
      source,
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to fetch vote logs:", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}

const adjustVotesSchema = z.object({
  countryId: z.string().min(1, "Country ID is required"),
  upvotesDelta: z.number().int().default(0),
  downvotesDelta: z.number().int().default(0),
  reason: z.string().trim().min(5, "Reason is mandatory and must be at least 5 characters long"),
}).refine(
  (data) => data.upvotesDelta !== 0 || data.downvotesDelta !== 0,
  { message: "Either upvotesDelta or downvotesDelta must be non-zero" }
);

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

    const raw = await request.json();
    const parsed = adjustVotesSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 422 }
      );
    }

    const { countryId, upvotesDelta, downvotesDelta, reason } = parsed.data;

    const res = await adminService.adjustVotes(
      session.user.id,
      countryId,
      upvotesDelta,
      downvotesDelta,
      reason
    );

    return NextResponse.json({ success: true, data: res });
  } catch (error: any) {
    console.error("Failed to adjust votes:", error);
    return NextResponse.json({ error: error.message || "INTERNAL_SERVER_ERROR" }, { status: 400 });
  }
}
