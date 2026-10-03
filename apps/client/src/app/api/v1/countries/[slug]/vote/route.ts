import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { votingService } from "@/server/voting/voting.service";
import { voter, voteFailure } from "@/server/voting/vote-http";
import { VoteError } from "@/server/voting/vote-validation";

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    const userId = await voter(request, true);
    let input: unknown;
    try { input = await request.json(); } catch { throw new VoteError("INVALID_VOTE", 422, "Expected a JSON vote command."); }
    const { slug } = await context.params;
    const result = await votingService.castVote(userId, slug, input);
    // Presentation failures must never turn a committed vote into a failed response.
    try { revalidatePath("/"); revalidatePath("/countries"); revalidatePath(`/country/${slug}`); } catch (error) { console.error("Vote cache refresh failed", error); }
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return voteFailure(error); }
}
