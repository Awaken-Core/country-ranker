import { NextResponse } from "next/server";
import { voter, voteFailure } from "@/server/voting/vote-http";
import { votingService } from "@/server/voting/voting.service";
export async function GET(request: Request) {
  try {
    return NextResponse.json(
      await votingService.getBalance(await voter(request)),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return voteFailure(error);
  }
}
