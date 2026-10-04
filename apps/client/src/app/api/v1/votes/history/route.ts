import { NextResponse } from "next/server";
import { client } from "@/lib/db";
import { voter, voteFailure } from "@/server/voting/vote-http";
import { VoteError } from "@/server/voting/vote-validation";
export async function GET(request: Request) {
  try {
    const userId = await voter(request);
    const query = new URL(request.url).searchParams;
    const page = Number(query.get("page") ?? 1),
      limit = Number(query.get("limit") ?? 20);
    if (
      !Number.isSafeInteger(page) ||
      page < 1 ||
      page > 1000000 ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100
    )
      throw new VoteError("INVALID_QUERY", 422, "Invalid pagination.");
    const [data, total] = await client.$transaction([
      client.voteLog.findMany({
        where: { userId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        select: {
          id: true,
          count: true,
          voteType: true,
          voteIntentionType: true,
          createdAt: true,
          country: { select: { name: true, slug: true, code: true } },
        },
      }),
      client.voteLog.count({ where: { userId } }),
    ]);
    return NextResponse.json(
      {
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return voteFailure(error);
  }
}
