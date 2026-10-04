import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { VotingService, balance } from "../src/server/voting/voting.service";
import {
  DAILY_FREE_VOTES,
  utcDay,
  voteCommandSchema,
} from "../src/server/voting/vote-validation";

type VoteType = "UPVOTE" | "DOWNVOTE";

type StoredVote = {
  id: string;
  userId: string;
  countryId: string;
  voteType: VoteType;
  voteIntentionType: "FREE" | "PURCHASED";
  count: number;
  requestId: string;
  result: unknown;
};

function createVotingHarness() {
  const country = {
    id: "country-1",
    slug: "testland",
    totalUpvoteCount: 0n,
    totalDownvoteCount: 0n,
  };
  const usage = {
    userId: "user-1",
    voteDate: utcDay(new Date("2026-01-15T10:00:00Z")),
    upvoteUsedCount: 0,
    downvoteUsedCount: 0,
  };
  const logs: StoredVote[] = [];
  const freeDetails: Omit<
    StoredVote,
    "id" | "voteIntentionType" | "requestId" | "result"
  >[] = [];
  const paidDetails: Omit<
    StoredVote,
    "id" | "voteIntentionType" | "requestId" | "result"
  >[] = [];

  const tx = {
    $executeRaw: async () => 0,
    user: {
      findUnique: async () => ({ id: "user-1", emailVerified: true }),
    },
    dailyVoteUsage: {
      findUnique: async () => usage,
      upsert: async () => usage,
      updateMany: async ({ where, data }: never) => {
        const input = { where, data } as unknown as {
          where: {
            upvoteUsedCount?: { lt: number };
            downvoteUsedCount?: { lt: number };
          };
          data: {
            upvoteUsedCount?: { increment: number };
            downvoteUsedCount?: { increment: number };
          };
        };

        if (input.where.upvoteUsedCount) {
          if (usage.upvoteUsedCount >= input.where.upvoteUsedCount.lt)
            return { count: 0 };
          usage.upvoteUsedCount += input.data.upvoteUsedCount!.increment;
          return { count: 1 };
        }

        if (usage.downvoteUsedCount >= input.where.downvoteUsedCount!.lt)
          return { count: 0 };
        usage.downvoteUsedCount += input.data.downvoteUsedCount!.increment;
        return { count: 1 };
      },
    },
    payment: {
      aggregate: async () => ({ _sum: { voteQuantity: 0 } }),
    },
    countryVotePaid: {
      aggregate: async () => ({
        _sum: {
          count: paidDetails.reduce((total, vote) => total + vote.count, 0),
        },
      }),
    },
    country: {
      findUnique: async () => country,
      update: async ({ data }: never) => {
        const update = data as unknown as {
          totalUpvoteCount?: { increment: number };
          totalDownvoteCount?: { increment: number };
        };
        if (update.totalUpvoteCount)
          country.totalUpvoteCount += BigInt(update.totalUpvoteCount.increment);
        if (update.totalDownvoteCount)
          country.totalDownvoteCount += BigInt(
            update.totalDownvoteCount.increment,
          );
        return country;
      },
    },
    voteLog: {
      findUnique: async ({ where }: never) => {
        const requestId = (where as unknown as { requestId: string }).requestId;
        const log = logs.find((item) => item.requestId === requestId);
        return log ? { ...log, country } : null;
      },
      create: async ({ data }: never) => {
        const input = data as unknown as Omit<StoredVote, "id"> & {
          freeDetail?: { create: (typeof freeDetails)[number] };
          paidDetail?: { create: (typeof paidDetails)[number] };
        };
        const log: StoredVote = {
          id: `log-${logs.length + 1}`,
          userId: input.userId,
          countryId: input.countryId,
          voteType: input.voteType,
          voteIntentionType: input.voteIntentionType,
          count: input.count,
          requestId: input.requestId,
          result: input.result,
        };
        logs.push(log);
        if (input.freeDetail) freeDetails.push(input.freeDetail.create);
        if (input.paidDetail) paidDetails.push(input.paidDetail.create);
        return log;
      },
    },
  };

  const db = {
    $transaction: async (operation: (transaction: typeof tx) => unknown) =>
      operation(tx),
  };
  const now = new Date("2026-01-15T10:00:00Z");
  const service = new VotingService(db as never, () => now);

  return { service, tx, country, usage, logs, freeDetails, paidDetails, now };
}

function voteCommand(voteType: VoteType, sequence: number) {
  return {
    voteType,
    source: "FREE" as const,
    count: 1 as const,
    idempotencyKey: `00000000-0000-4000-8000-${sequence.toString().padStart(12, "0")}`,
  };
}

describe("append-only voting ledger", () => {
  it("records 3 upvotes and 2 downvotes as five immutable events with score 1", async () => {
    const harness = createVotingHarness();
    const directions: VoteType[] = [
      "UPVOTE",
      "UPVOTE",
      "UPVOTE",
      "DOWNVOTE",
      "DOWNVOTE",
    ];

    for (const [index, direction] of directions.entries()) {
      await harness.service.castVote(
        "user-1",
        "testland",
        voteCommand(direction, index + 1),
      );
    }

    assert.equal(harness.logs.length, 5);
    assert.equal(harness.freeDetails.length, 5);
    assert.equal(harness.paidDetails.length, 0);
    assert.deepEqual(
      harness.logs.map(({ voteType, count }) => ({ voteType, count })),
      directions.map((voteType) => ({ voteType, count: 1 })),
    );
    assert.equal(harness.country.totalUpvoteCount, 3n);
    assert.equal(harness.country.totalDownvoteCount, 2n);
    assert.equal(
      harness.country.totalUpvoteCount - harness.country.totalDownvoteCount,
      1n,
    );
  });

  it("replays an idempotency key without creating or counting another vote", async () => {
    const harness = createVotingHarness();
    const command = voteCommand("UPVOTE", 10);

    const first = await harness.service.castVote("user-1", "testland", command);
    const replay = await harness.service.castVote(
      "user-1",
      "testland",
      command,
    );

    assert.deepEqual(replay, first);
    assert.equal(harness.logs.length, 1);
    assert.equal(harness.freeDetails.length, 1);
    assert.equal(harness.country.totalUpvoteCount, 1n);
    assert.equal(harness.usage.upvoteUsedCount, 1);
  });
});

describe("vote balance and validation", () => {
  it("keeps separate daily upvote and downvote allowances", async () => {
    const harness = createVotingHarness();
    harness.usage.upvoteUsedCount = 2;
    harness.usage.downvoteUsedCount = 1;

    const result = await balance(harness.tx as never, "user-1", harness.now);

    assert.equal(result.upvoteRemaining, DAILY_FREE_VOTES - 2);
    assert.equal(result.downvoteRemaining, DAILY_FREE_VOTES - 1);
  });

  it("accepts only one vote per command", () => {
    assert.equal(
      voteCommandSchema.safeParse(voteCommand("UPVOTE", 20)).success,
      true,
    );
    assert.equal(
      voteCommandSchema.safeParse({ ...voteCommand("UPVOTE", 21), count: 2 })
        .success,
      false,
    );
  });
});
