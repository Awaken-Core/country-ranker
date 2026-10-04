import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AdminService } from "../src/modules/admin/admin.service";
import { AdminPermission, UserRole } from "../src/modules/admin/admin.types";

interface FakeAdminDbState {
  users: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    emailVerified: boolean;
    image: string | null;
    createdAt: Date;
    permissions: { permission: AdminPermission }[];
  }[];
  countries: {
    id: string;
    name: string;
    code: string;
    slug: string;
    totalUpvoteCount: bigint;
    totalDownvoteCount: bigint;
  }[];
  auditLogs: {
    id: string;
    userId: string;
    action: string;
    targetType: string;
    targetId?: string;
    details?: any;
    createdAt: Date;
  }[];
}

function makeFakeRepo(state: FakeAdminDbState) {
  return {
    async findUserWithRoleAndPermissions(userId: string) {
      return state.users.find((u) => u.id === userId) || null;
    },
    async adjustCountryVotes(countryId: string, upvotesDelta: number, downvotesDelta: number) {
      const country = state.countries.find((c) => c.id === countryId);
      if (!country) throw new Error("Country not found");
      const prevUpvotes = Number(country.totalUpvoteCount);
      const prevDownvotes = Number(country.totalDownvoteCount);

      const targetUpvotes = Math.max(0, prevUpvotes + upvotesDelta);
      const targetDownvotes = Math.max(0, prevDownvotes + downvotesDelta);

      country.totalUpvoteCount = BigInt(targetUpvotes);
      country.totalDownvoteCount = BigInt(targetDownvotes);

      return {
        country,
        previousUpvotes: prevUpvotes,
        newUpvotes: targetUpvotes,
        previousDownvotes: prevDownvotes,
        newDownvotes: targetDownvotes,
      };
    },
    async createAuditLog(params: any) {
      const log = { id: `log-${Date.now()}`, ...params, createdAt: new Date() };
      state.auditLogs.push(log);
      return log;
    },
    async updateUserRole(userId: string, role: UserRole) {
      const user = state.users.find((u) => u.id === userId);
      if (!user) throw new Error("User not found");
      user.role = role;
      return user;
    },
    async setUserPermissions(userId: string, permissions: AdminPermission[]) {
      const user = state.users.find((u) => u.id === userId);
      if (!user) throw new Error("User not found");
      user.permissions = permissions.map((p) => ({ permission: p }));
      return user.permissions;
    },
    async updateCountryDetails(countryId: string, data: any) {
      const country = state.countries.find((c) => c.id === countryId);
      if (!country) throw new Error("Country not found");
      Object.assign(country, data);
      return country;
    },
  } as any;
}

describe("Admin RBAC & Vote Adjustment Service", () => {
  const setup = () => {
    const state: FakeAdminDbState = {
      users: [
        {
          id: "super-1",
          name: "Super Boss",
          email: "super@countryrank.io",
          role: "SUPER_ADMIN",
          emailVerified: true,
          image: null,
          createdAt: new Date(),
          permissions: [],
        },
        {
          id: "admin-adjuster",
          name: "Vote Admin",
          email: "voter-admin@countryrank.io",
          role: "ADMIN",
          emailVerified: true,
          image: null,
          createdAt: new Date(),
          permissions: [{ permission: "VOTES_ADJUST" }, { permission: "VOTES_VIEW" }],
        },
        {
          id: "admin-viewer-only",
          name: "View Admin",
          email: "viewer@countryrank.io",
          role: "ADMIN",
          emailVerified: true,
          image: null,
          createdAt: new Date(),
          permissions: [{ permission: "VOTES_VIEW" }],
        },
        {
          id: "regular-user",
          name: "Voter Jane",
          email: "jane@gmail.com",
          role: "USER",
          emailVerified: true,
          image: null,
          createdAt: new Date(),
          permissions: [],
        },
      ],
      countries: [
        {
          id: "country-in",
          name: "India",
          code: "IN",
          slug: "india",
          totalUpvoteCount: BigInt(100),
          totalDownvoteCount: BigInt(20),
        },
      ],
      auditLogs: [],
    };

    const repo = makeFakeRepo(state);
    const service = new AdminService(repo);
    return { state, service };
  };

  it("1. SUPER_ADMIN has full access to adjust votes and create admins", async () => {
    const { state, service } = setup();

    const res = await service.adjustVotes("super-1", "country-in", 50, 0, "Super admin score bonus");
    assert.equal(Number(res.totalUpvoteCount), 150);

    const audit = state.auditLogs[0];
    assert.equal(audit.action, "ADJUST_VOTES");
    assert.equal(audit.userId, "super-1");
    assert.equal(audit.details.previousUpvotes, 100);
    assert.equal(audit.details.newUpvotes, 150);
    assert.equal(audit.details.reason, "Super admin score bonus");
  });

  it("2. ADMIN with VOTES_ADJUST can adjust votes", async () => {
    const { service } = setup();

    const res = await service.adjustVotes("admin-adjuster", "country-in", 10, -5, "Corrected duplicate vote spam");
    assert.equal(Number(res.totalUpvoteCount), 110);
    assert.equal(Number(res.totalDownvoteCount), 15);
  });

  it("3. ADMIN without VOTES_ADJUST cannot adjust votes", async () => {
    const { service } = setup();

    await assert.rejects(
      async () => service.adjustVotes("admin-viewer-only", "country-in", 10, 0, "Attempted illegal edit"),
      (err: Error) => {
        assert.ok(err.message.includes("INSUFFICIENT_PERMISSIONS") || err.message.includes("Missing required permission"));
        return true;
      }
    );
  });

  it("4. Normal USER cannot access admin operations", async () => {
    const { service } = setup();

    await assert.rejects(
      async () => service.adjustVotes("regular-user", "country-in", 10, 0, "Hacker attempt"),
      (err: Error) => {
        assert.ok(err.message.includes("FORBIDDEN"));
        return true;
      }
    );
  });

  it("5. Vote totals never drop below zero when negative delta exceeds current count", async () => {
    const { state, service } = setup();

    // India starts with 100 upvotes, 20 downvotes
    // Attempting -500 upvotes and -50 downvotes
    const res = await service.adjustVotes("super-1", "country-in", -500, -50, "Calamity audit deduction");
    assert.equal(Number(res.totalUpvoteCount), 0);
    assert.equal(Number(res.totalDownvoteCount), 0);

    const audit = state.auditLogs[0];
    assert.equal(audit.details.previousUpvotes, 100);
    assert.equal(audit.details.newUpvotes, 0);
    assert.equal(audit.details.previousDownvotes, 20);
    assert.equal(audit.details.newDownvotes, 0);
  });

  it("6. Mandatory reason is strictly enforced with at least 5 characters", async () => {
    const { service } = setup();

    await assert.rejects(
      async () => service.adjustVotes("super-1", "country-in", 10, 0, ""),
      (err: Error) => {
        assert.ok(err.message.includes("Reason is mandatory"));
        return true;
      }
    );

    await assert.rejects(
      async () => service.adjustVotes("super-1", "country-in", 10, 0, "abc"),
      (err: Error) => {
        assert.ok(err.message.includes("at least 5 characters"));
        return true;
      }
    );
  });

  it("7. ADMIN cannot create/promote users to ADMIN or remove admins", async () => {
    const { service } = setup();

    await assert.rejects(
      async () => service.createAdmin("admin-adjuster", "regular-user", ["COUNTRIES_VIEW"]),
      (err: Error) => {
        assert.ok(err.message.includes("Only SUPER_ADMIN can create new admins"));
        return true;
      }
    );

    await assert.rejects(
      async () => service.removeAdmin("admin-adjuster", "admin-viewer-only"),
      (err: Error) => {
        assert.ok(err.message.includes("Only SUPER_ADMIN can remove admins"));
        return true;
      }
    );
  });
});
