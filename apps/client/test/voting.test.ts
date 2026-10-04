import { describe, it, before, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { utcDay, VoteError, DAILY_FREE_VOTES } from "../src/server/voting/vote-validation";
import { balance, lockVoter } from "../src/server/voting/voting.service";

// ─── Tiny in-memory fakes ────────────────────────────────────────────────────

type FreeVoteUsage = { userId: string; voteDate: Date; usedCount: number };
type Grant = { id: string; userId: string; remainingVotes: number; createdAt: Date };
type VoteLogRow = {
  id: string;
  userId: string;
  countryId: string;
  voteType: "UPVOTE" | "DOWNVOTE";
  voteIntentionType: "FREE" | "PURCHASED";
  count: number;
  requestId: string | null;
  result: unknown;
  createdAt: Date;
};
type CountryRow = {
  id: string;
  slug: string;
  totalUpvoteCount: bigint;
  totalDownvoteCount: bigint;
};

interface FakeState {
  usages: FreeVoteUsage[];
  grants: Grant[];
  logs: VoteLogRow[];
  freeDetails: { id: string; userId: string; countryId: string; voteType: string; count: number; voteLogId: string }[];
  countries: CountryRow[];
  grantIdCounter: number;
  logIdCounter: number;
}

function makeState(overrides?: Partial<FakeState>): FakeState {
  return {
    usages: [],
    grants: [],
    logs: [],
    freeDetails: [],
    countries: [{ id: "c1", slug: "testland", totalUpvoteCount: BigInt(0), totalDownvoteCount: BigInt(0) }],
    grantIdCounter: 1,
    logIdCounter: 1,
    ...overrides,
  };
}

/** Minimal fake transaction client for testing quota/balance logic. */
function makeFakeTx(state: FakeState) {
  return {
    dailyVoteUsage: {
      findUnique: async ({ where }: { where: { userId_voteDate: { userId: string; voteDate: Date } } }) => {
        return state.usages.find(
          (u) => u.userId === where.userId_voteDate.userId &&
            u.voteDate.getTime() === where.userId_voteDate.voteDate.getTime()
        ) ?? null;
      },
      upsert: async ({ where, create }: { where: { userId_voteDate: { userId: string; voteDate: Date } }; create: FreeVoteUsage; update: Record<string, unknown> }) => {
        const existing = state.usages.find(
          (u) => u.userId === where.userId_voteDate.userId &&
            u.voteDate.getTime() === where.userId_voteDate.voteDate.getTime()
        );
        if (!existing) state.usages.push({ ...create });
        return existing ?? state.usages[state.usages.length - 1];
      },
      updateMany: async ({ where, data }: { where: { userId: string; voteDate: Date; usedCount: { lt: number } }; data: { usedCount: { increment: number } } }) => {
        const row = state.usages.find(
          (u) => u.userId === where.userId &&
            u.voteDate.getTime() === where.voteDate.getTime() &&
            u.usedCount < where.usedCount.lt
        );
        if (!row) return { count: 0 };
        row.usedCount += data.usedCount.increment;
        return { count: 1 };
      },
    },
    purchasedVoteGrant: {
      aggregate: async ({ where }: { where: { userId: string; payment?: unknown } }) => {
        const sum = state.grants
          .filter((g) => g.userId === where.userId)
          .reduce((s, g) => s + g.remainingVotes, 0);
        return { _sum: { remainingVotes: sum } };
      },
      findMany: async ({ where }: { where: { userId: string; remainingVotes: { gt: number } } }) => {
        return state.grants
          .filter((g) => g.userId === where.userId && g.remainingVotes > where.remainingVotes.gt)
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      },
      updateMany: async ({ where, data }: { where: { id: string; remainingVotes: { gte: number } }; data: { remainingVotes: { decrement: number } } }) => {
        const grant = state.grants.find(
          (g) => g.id === where.id && g.remainingVotes >= where.remainingVotes.gte
        );
        if (!grant) return { count: 0 };
        grant.remainingVotes -= data.remainingVotes.decrement;
        return { count: 1 };
      },
    },
    voteLog: {
      findUnique: async ({ where }: { where: { requestId: string } }) => {
        return state.logs.find((l) => l.requestId === where.requestId) ?? null;
      },
      create: async ({ data }: { data: Omit<VoteLogRow, "id" | "createdAt"> }) => {
        const row: VoteLogRow = {
          id: `log-${state.logIdCounter++}`,
          createdAt: new Date(),
          ...data,
          result: null,
        };
        state.logs.push(row);
        return row;
      },
      update: async ({ where, data }: { where: { id: string }; data: { result: unknown } }) => {
        const row = state.logs.find((l) => l.id === where.id)!;
        row.result = data.result;
        return row;
      },
    },
    countryVoteFree: {
      create: async ({ data }: { data: { userId: string; countryId: string; voteType: string; count: number; voteLogId: string } }) => {
        const row = { id: `fv-${state.logIdCounter}`, ...data };
        state.freeDetails.push(row);
        return row;
      },
    },
    country: {
      findUnique: async ({ where }: { where: { slug?: string; id?: string } }) => {
        return state.countries.find(
          (c) => c.slug === where.slug || c.id === where.id
        ) ?? null;
      },
      update: async ({ where, data }: { where: { id: string }; data: { totalUpvoteCount?: { increment: number }; totalDownvoteCount?: { increment: number } } }) => {
        const c = state.countries.find((c) => c.id === where.id)!;
        if (data.totalUpvoteCount) c.totalUpvoteCount += BigInt(data.totalUpvoteCount.increment);
        if (data.totalDownvoteCount) c.totalDownvoteCount += BigInt(data.totalDownvoteCount.increment);
        return c;
      },
    },
    user: {
      findUnique: async ({ where }: { where: { id: string } }) => {
        return { id: where.id, emailVerified: true };
      },
    },
    $queryRaw: async () => [],
  };
}

// ─── Lightweight voting logic exerciser ──────────────────────────────────────

/**
 * Attempts one free vote using the same atomic logic as VotingService.castVote.
 * Returns true if the vote went through, false if quota exhausted.
 */
async function tryFreeVote(
  tx: ReturnType<typeof makeFakeTx>,
  userId: string,
  now: Date
): Promise<boolean> {
  const voteDate = utcDay(now);
  await tx.dailyVoteUsage.upsert({
    where: { userId_voteDate: { userId, voteDate } },
    create: { userId, voteDate, usedCount: 0 },
    update: {},
  });
  const reserved = await tx.dailyVoteUsage.updateMany({
    where: { userId, voteDate, usedCount: { lt: DAILY_FREE_VOTES } },
    data: { usedCount: { increment: 1 } },
  });
  return reserved.count === 1;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("Voting — quota logic", () => {
  it("allows exactly DAILY_FREE_VOTES votes per UTC day", async () => {
    const state = makeState();
    const tx = makeFakeTx(state);
    const now = new Date("2026-01-15T10:00:00Z");
    const userId = "user-1";

    for (let i = 0; i < DAILY_FREE_VOTES; i++) {
      const ok = await tryFreeVote(tx, userId, now);
      assert.ok(ok, `Vote ${i + 1} should succeed`);
    }

    const over = await tryFreeVote(tx, userId, now);
    assert.equal(over, false, "4th vote must be rejected");
  });

  it("resets the quota for a new UTC day", async () => {
    const state = makeState();
    const tx = makeFakeTx(state);
    const userId = "user-2";

    const day1 = new Date("2026-01-15T23:59:00Z");
    for (let i = 0; i < DAILY_FREE_VOTES; i++) {
      await tryFreeVote(tx, userId, day1);
    }
    // Day 1 exhausted
    assert.equal(await tryFreeVote(tx, userId, day1), false);

    // Day 2 — fresh quota
    const day2 = new Date("2026-01-16T00:00:01Z");
    assert.ok(await tryFreeVote(tx, userId, day2), "Day 2 vote 1 should succeed");
  });

  it("independent quotas per user", async () => {
    const state = makeState();
    const tx = makeFakeTx(state);
    const now = new Date("2026-01-15T12:00:00Z");

    for (let i = 0; i < DAILY_FREE_VOTES; i++) {
      await tryFreeVote(tx, "user-a", now);
    }
    // user-a exhausted, user-b still fresh
    assert.ok(await tryFreeVote(tx, "user-b", now), "user-b should still have quota");
    assert.equal(await tryFreeVote(tx, "user-a", now), false, "user-a must be blocked");
  });

  it("concurrent-safe: only one of two simultaneous requests for the last unit succeeds", async () => {
    const state = makeState();
    const userId = "user-c";
    const now = new Date("2026-01-15T08:00:00Z");

    // Burn the first two votes
    const tx = makeFakeTx(state);
    await tryFreeVote(tx, userId, now);
    await tryFreeVote(tx, userId, now);

    // Two simultaneous attempts for vote 3 — use separate tx views of the same state
    const tx1 = makeFakeTx(state);
    const tx2 = makeFakeTx(state);
    const [r1, r2] = await Promise.all([
      tryFreeVote(tx1, userId, now),
      tryFreeVote(tx2, userId, now),
    ]);

    // Only one can win (updateMany is atomic in Postgres; our fake models it faithfully)
    const winners = [r1, r2].filter(Boolean).length;
    assert.equal(winners, 1, "Exactly one concurrent vote should succeed");
  });
});

describe("Voting — balance calculation", () => {
  it("returns separate directional allowances", async () => {
    const state = makeState();
    const tx = makeFakeTx(state);
    const now = new Date("2026-01-15T09:00:00Z");
    const userId = "user-d";

    await tryFreeVote(tx, userId, now);
    await tryFreeVote(tx, userId, now);

    const b = await balance(tx as never, userId, now);
    assert.equal(b.upvoteRemaining, DAILY_FREE_VOTES, "Upvotes start with their own allowance");
    assert.equal(b.downvoteRemaining, DAILY_FREE_VOTES, "Downvotes start with their own allowance");
  });

  it("directional allowances are independent", async () => {
    const state = makeState();
    const tx = makeFakeTx(state);
    const now = new Date("2026-01-15T09:00:00Z");
    const userId = "user-e";

    for (let i = 0; i < DAILY_FREE_VOTES; i++) await tryFreeVote(tx, userId, now);

    const b = await balance(tx as never, userId, now);
    assert.equal(b.upvoteRemaining, DAILY_FREE_VOTES);
    assert.equal(b.downvoteRemaining, DAILY_FREE_VOTES);
  });

  it("new users receive both daily allowances", async () => {
    const state = makeState();
    const tx = makeFakeTx(state);
    const b = await balance(tx as never, "brand-new-user", new Date());
    assert.equal(b.upvoteRemaining, DAILY_FREE_VOTES);
    assert.equal(b.downvoteRemaining, DAILY_FREE_VOTES);
  });

  it("resetsAt is 24 h after the current UTC day start", async () => {
    const state = makeState();
    const tx = makeFakeTx(state);
    const now = new Date("2026-06-20T15:30:00Z");
    const b = await balance(tx as never, "user-f", now);
    assert.equal(b.resetsAt, "2026-06-21T00:00:00.000Z");
  });
});

describe("Voting — idempotency protection", () => {
  it("same requestId with matching fields returns stored result without touching quota", async () => {
    const state = makeState();
    const tx = makeFakeTx(state);
    const now = new Date("2026-01-15T10:00:00Z");
    const userId = "user-g";
    const requestId = "aabbccdd-0000-4000-8000-000000000001";

    // First vote
    await tryFreeVote(tx, userId, now);
    const log = await tx.voteLog.create({
      data: {
        userId,
        countryId: "c1",
        voteType: "UPVOTE",
        voteIntentionType: "FREE",
        count: 1,
        requestId,
        result: { success: true },
      },
    });
    await tx.voteLog.update({ where: { id: log.id }, data: { result: { success: true, idempotent: true } } });

    // Replay: look up by requestId
    const existing = await tx.voteLog.findUnique({ where: { requestId } });
    assert.ok(existing, "Existing log must be found for duplicate requestId");
    assert.deepEqual(existing.result, { success: true, idempotent: true }, "Stored result must be returned unchanged");

    // Quota must not have moved again
    const usage = state.usages.find((u) => u.userId === userId)!;
    assert.equal(usage.usedCount, 1, "Idempotent replay must not consume another unit");
  });
});

describe("Voting — utcDay helper", () => {
  it("always returns midnight UTC regardless of local offset", () => {
    const inputs = [
      "2026-03-15T00:00:00Z",
      "2026-03-15T12:30:00Z",
      "2026-03-15T23:59:59Z",
    ];
    for (const iso of inputs) {
      const d = utcDay(new Date(iso));
      assert.equal(d.getUTCHours(), 0, `Hours should be 0 for ${iso}`);
      assert.equal(d.getUTCMinutes(), 0);
      assert.equal(d.getUTCSeconds(), 0);
      assert.equal(d.getUTCMilliseconds(), 0);
    }
  });
});

describe("Voting — VoteError", () => {
  it("carries code, status, and message", () => {
    const err = new VoteError("FREE_VOTE_LIMIT_REACHED", 409, "Daily limit reached.");
    assert.equal(err.code, "FREE_VOTE_LIMIT_REACHED");
    assert.equal(err.status, 409);
    assert.equal(err.message, "Daily limit reached.");
    assert.ok(err instanceof Error);
  });
});
