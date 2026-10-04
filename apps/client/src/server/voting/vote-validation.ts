import { z } from "zod";

export const DAILY_FREE_VOTES = 3;
export const voteCommandSchema = z
  .object({
    voteType: z.enum(["UPVOTE", "DOWNVOTE"]),
    source: z.enum(["FREE", "PURCHASED"]),
    count: z.literal(1).default(1),
    idempotencyKey: z.string().uuid(),
  })
  .strict();
export type VoteCommand = z.output<typeof voteCommandSchema>;
export function utcDay(now = new Date()) {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}
export class VoteError extends Error {
  constructor(
    public code: string,
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export type VoteResult = {
  success: true;
  country: {
    slug: string;
    totalUpvoteCount: string;
    totalDownvoteCount: string;
  };
  voting: {
    upvoteRemaining: number;
    downvoteRemaining: number;
    purchasedRemaining: number;
    resetsAt: string;
  };
};
