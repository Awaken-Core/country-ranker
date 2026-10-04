import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { client } from "@/lib/db";
import { env } from "@/lib/env";
import { VoteError } from "./vote-validation";

export async function voter(request: Request, mutation = false) {
  if (mutation && request.headers.get("origin") !== new URL(env.NEXT_PUBLIC_APP_BASE_URL).origin)
    throw new VoteError("FORBIDDEN_ORIGIN", 403, "Vote requests must come from this website.");
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) throw new VoteError("UNAUTHORIZED", 401, "Sign in to vote.");
  return session.user.id;
}
export function voteFailure(error: unknown) {
  if (error instanceof VoteError) return NextResponse.json({ error: error.code, message: error.message }, { status: error.status });
  // Route handlers and services can be compiled into separate development
  // bundles. Preserve known domain errors even when instanceof crosses one of
  // those bundle boundaries.
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "status" in error &&
    "message" in error &&
    typeof error.code === "string" &&
    typeof error.status === "number" &&
    typeof error.message === "string"
  ) {
    return NextResponse.json({ error: error.code, message: error.message }, { status: error.status });
  }
  console.error("Voting request failed", error);
  return NextResponse.json({ error: "INTERNAL_SERVER_ERROR", message: "Unable to process the request. Retry with the same request key." }, { status: 500 });
}
export async function limitVoteRequests(userId: string) {
  const windowStart = new Date(Math.floor(Date.now() / 60000) * 60000);
  // Separate transaction: rejected attempts must still count. Shared across app instances.
  const rows = await client.$queryRaw<{ attempts: number }[]>`
    INSERT INTO vote_rate_limit (key, "windowStart", attempts) VALUES (${`user:${userId}`}, ${windowStart}, 1)
    ON CONFLICT (key) DO UPDATE SET
      attempts = CASE WHEN vote_rate_limit."windowStart" = EXCLUDED."windowStart" THEN vote_rate_limit.attempts + 1 ELSE 1 END,
      "windowStart" = EXCLUDED."windowStart" RETURNING attempts`;
  if (rows[0].attempts > 30) throw new VoteError("RATE_LIMITED", 429, "Too many attempts. Try again in a minute.");
}
