import { NextRequest, NextResponse } from "next/server";
import { rankingService } from "@/modules/ranking/ranking.service";
import { GetRankingQuerySchema } from "@/modules/ranking/ranking.schema";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = GetRankingQuerySchema.safeParse({
      search: searchParams.get("search") || undefined,
      page: searchParams.get("page") || undefined,
      limit: searchParams.get("limit") || undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid ranking query parameters",
          details: parsed.error.format(),
        },
        { status: 400 },
      );
    }

    const ranking = await rankingService.getLiveRanking(parsed.data);
    return NextResponse.json(ranking);
  } catch (error) {
    console.error("GET /api/v1/ranking error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
