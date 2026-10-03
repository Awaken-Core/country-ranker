import { Prisma, PrismaClient } from "@prisma/client";
import { client } from "@/lib/db";
import { env } from "@/lib/env";
import { DAILY_FREE_VOTES, utcDay, voteCommandSchema, VoteError, type VoteResult } from "./vote-validation";

type Tx = Prisma.TransactionClient;
export async function lockVoter(tx: Tx, userId: string) {
  // pg_advisory_xact_lock returns PostgreSQL's void type. Prisma's pg adapter
  // cannot deserialize void through $queryRaw, while $executeRaw correctly
  // runs the lock statement without trying to read its return value.
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${userId}, 0))`;
}
export async function balance(tx: Tx, userId: string, now = new Date()) {
  const day = utcDay(now);
  const [usage, grants] = await Promise.all([
    tx.dailyVoteUsage.findUnique({ where: { userId_voteDate: { userId, voteDate: day } } }),
    tx.purchasedVoteGrant.aggregate({ where: { userId, payment: { status: "COMPLETED" } }, _sum: { remainingVotes: true } }),
  ]);
  return {
    upvoteRemaining: Math.max(0, DAILY_FREE_VOTES - (usage?.upvoteUsedCount ?? 0)),
    downvoteRemaining: Math.max(0, DAILY_FREE_VOTES - (usage?.downvoteUsedCount ?? 0)),
    purchasedRemaining: grants._sum.remainingVotes ?? 0,
    resetsAt: new Date(day.getTime() + 86400000).toISOString(),
  };
}

export class VotingService {
  constructor(private db: PrismaClient = client, private clock = () => new Date()) {}
  async getBalance(userId: string) {
    return this.db.$transaction(async tx => { await lockVoter(tx, userId); return balance(tx, userId, this.clock()); });
  }
  async castVote(userId: string, slug: string, raw: unknown): Promise<VoteResult> {
    const parsed = voteCommandSchema.safeParse(raw);
    if (!parsed.success) throw new VoteError("INVALID_VOTE", 422, "Invalid vote direction, source, quantity or request key.");
    const input = parsed.data;
    return this.db.$transaction(async tx => {
      await lockVoter(tx, userId);
      const existing = await tx.voteLog.findUnique({ where: { requestId: input.idempotencyKey }, include: { country: true } });
      if (existing) {
        if (existing.userId !== userId || existing.country.slug !== slug || existing.voteType !== input.voteType || existing.voteIntentionType !== input.source || existing.count !== input.count)
          throw new VoteError("IDEMPOTENCY_CONFLICT", 409, "This request key belongs to a different vote.");
        return existing.result as unknown as VoteResult;
      }
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new VoteError("UNAUTHORIZED", 401, "Sign in to vote.");
      if (env.VOTING_REQUIRE_VERIFIED_EMAIL === "true" && !user.emailVerified)
        throw new VoteError("EMAIL_NOT_VERIFIED", 403, "Verify your email before voting.");
      const country = await tx.country.findUnique({ where: { slug } });
      if (!country) throw new VoteError("COUNTRY_NOT_FOUND", 404, "Country not found.");
      const now = this.clock();
      const allocations: { grantId: string; count: number }[] = [];
      if (input.source === "FREE") {
        const voteDate = utcDay(now);
        await tx.dailyVoteUsage.upsert({ where: { userId_voteDate: { userId, voteDate } }, create: { userId, voteDate }, update: {} });
        const reserved = input.voteType === "UPVOTE"
          ? await tx.dailyVoteUsage.updateMany({ where: { userId, voteDate, upvoteUsedCount: { lt: DAILY_FREE_VOTES } }, data: { upvoteUsedCount: { increment: 1 } } })
          : await tx.dailyVoteUsage.updateMany({ where: { userId, voteDate, downvoteUsedCount: { lt: DAILY_FREE_VOTES } }, data: { downvoteUsedCount: { increment: 1 } } });
        if (!reserved.count) {
          const direction = input.voteType === "UPVOTE" ? "upvotes" : "downvotes";
          throw new VoteError("FREE_VOTE_LIMIT_REACHED", 409, `You've used today's three free ${direction}. They reset at 00:00 UTC.`);
        }
      } else {
        const grants = await tx.purchasedVoteGrant.findMany({ where: { userId, remainingVotes: { gt: 0 }, payment: { status: "COMPLETED" } }, orderBy: [{ createdAt: "asc" }, { id: "asc" }] });
        let remaining = input.count;
        for (const grant of grants) {
          const count = Math.min(remaining, grant.remainingVotes);
          const spent = await tx.purchasedVoteGrant.updateMany({ where: { id: grant.id, remainingVotes: { gte: count } }, data: { remainingVotes: { decrement: count } } });
          if (!spent.count) throw new VoteError("INSUFFICIENT_PURCHASED_VOTES", 409, "Not enough purchased credits.");
          allocations.push({ grantId: grant.id, count });
          remaining -= count;
          if (!remaining) break;
        }
        if (remaining) throw new VoteError("INSUFFICIENT_PURCHASED_VOTES", 409, "Not enough purchased credits.");
      }
      const event = { userId, countryId: country.id, voteType: input.voteType, count: input.count };
      const log = await tx.voteLog.create({ data: { ...event, voteIntentionType: input.source, requestId: input.idempotencyKey } });
      if (input.source === "FREE") await tx.countryVoteFree.create({ data: { ...event, voteLogId: log.id } });
      else await tx.countryVotePaid.create({ data: { ...event, voteLogId: log.id, allocations: { create: allocations } } });
      const totals = await tx.country.update({ where: { id: country.id }, data: input.voteType === "UPVOTE" ? { totalUpvoteCount: { increment: input.count } } : { totalDownvoteCount: { increment: input.count } } });
      const result: VoteResult = { success: true, country: { slug, totalUpvoteCount: totals.totalUpvoteCount.toString(), totalDownvoteCount: totals.totalDownvoteCount.toString() }, voting: await balance(tx, userId, now) };
      await tx.voteLog.update({ where: { id: log.id }, data: { result: result as unknown as Prisma.InputJsonValue } });
      return result;
    }, { timeout: 15000 });
  }
}
export const votingService = new VotingService();
