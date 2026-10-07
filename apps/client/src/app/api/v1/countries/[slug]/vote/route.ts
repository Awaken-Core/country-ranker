import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { votingService } from "@/server/voting/voting.service";
import { voter, voteFailure } from "@/server/voting/vote-http";
import { VoteError } from "@/server/voting/vote-validation";
import { getClientIp } from "@/lib/rate-limit/ip";
import { checkRateLimit, maskIdentifier } from "@/lib/rate-limit/limiters";
import { createRateLimitResponse } from "@/lib/rate-limit/response";

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    // 1. IP rate limiting (30 requests/min/IP)
    const clientIp = getClientIp(request);
    const ipCheck = await checkRateLimit("vote_ip", clientIp);
    if (!ipCheck.success) {
      console.warn(
        `[RateLimit Blocked] Vote IP limit exceeded for IP: ${maskIdentifier(clientIp)}`,
      );
      return createRateLimitResponse(
        ipCheck,
        "Too many vote requests from this IP. Please wait a minute.",
      );
    }

    // 2. Authentication & Origin Verification
    const userId = await voter(request, true);

    // 3. Authenticated User rate limiting (10 requests/min/user)
    const userCheck = await checkRateLimit("vote_user", userId);
    if (!userCheck.success) {
      console.warn(
        `[RateLimit Blocked] Vote User limit exceeded for User: ${maskIdentifier(userId)}`,
      );
      return createRateLimitResponse(
        userCheck,
        "Too many vote requests for this account. Please wait a minute.",
      );
    }
    let input: unknown;
    try {
      input = await request.json();
    } catch {
      throw new VoteError("INVALID_VOTE", 422, "Expected a JSON vote command.");
    }
    const { slug } = await context.params;
    const result = await votingService.castVote(userId, slug, input);
    // Presentation failures must never turn a committed vote into a failed response.
    try {
      revalidatePath("/");
      revalidatePath("/countries");
      revalidatePath(`/country/${slug}`);
    } catch (error) {
      console.error("Vote cache refresh failed", error);
    }
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return voteFailure(error);
  }
}
