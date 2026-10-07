import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  checkRateLimit,
  LIMITER_CONFIGS,
  resetMemoryFallback,
  maskIdentifier,
} from "../src/lib/rate-limit/limiters";
import { getClientIp } from "../src/lib/rate-limit/ip";
import { createRateLimitResponse } from "../src/lib/rate-limit/response";

describe("Rate Limiting System Tests", () => {
  beforeEach(() => {
    resetMemoryFallback();
  });

  describe("1. Client IP Extraction", () => {
    it("extracts IP correctly from cf-connecting-ip", () => {
      const req = new Request("http://localhost:3000/api/v1/countries", {
        headers: { "cf-connecting-ip": "198.51.100.42" },
      });
      assert.equal(getClientIp(req), "198.51.100.42");
    });

    it("extracts IP correctly from x-real-ip when cf header absent", () => {
      const req = new Request("http://localhost:3000/api/v1/countries", {
        headers: { "x-real-ip": "203.0.113.19" },
      });
      assert.equal(getClientIp(req), "203.0.113.19");
    });

    it("extracts the first IP from x-forwarded-for chain", () => {
      const req = new Request("http://localhost:3000/api/v1/countries", {
        headers: { "x-forwarded-for": "103.45.22.10, 192.168.1.1, 10.0.0.1" },
      });
      assert.equal(getClientIp(req), "103.45.22.10");
    });

    it("falls back to 127.0.0.1 when headers are missing or invalid", () => {
      const req = new Request("http://localhost:3000/api/v1/countries");
      assert.equal(getClientIp(req), "127.0.0.1");
    });
  });

  describe("2. General API Rate Limiter (60 req/min/IP)", () => {
    it("allows requests below the 60 request limit", async () => {
      const ip = "192.0.2.1";
      for (let i = 0; i < 5; i++) {
        const res = await checkRateLimit("api", ip);
        assert.equal(res.success, true);
        assert.equal(res.remaining, 60 - (i + 1));
      }
    });

    it("blocks request once exceeding the 60 request limit and returns 429 shape", async () => {
      const ip = "192.0.2.2";
      for (let i = 0; i < 60; i++) {
        const res = await checkRateLimit("api", ip);
        assert.equal(res.success, true);
      }
      // 61st request should be rejected
      const blocked = await checkRateLimit("api", ip);
      assert.equal(blocked.success, false);
      assert.equal(blocked.remaining, 0);

      const httpResponse = createRateLimitResponse(blocked);
      assert.equal(httpResponse.status, 429);
      assert.equal(httpResponse.headers.get("X-RateLimit-Limit"), "60");
      assert.equal(httpResponse.headers.get("X-RateLimit-Remaining"), "0");
      assert.ok(httpResponse.headers.get("Retry-After"));
    });
  });

  describe("3. Multi-Layer Voting Rate Limiter (Separate IP and User Buckets)", () => {
    it("enforces User limit independently from IP (10 req/min/user)", async () => {
      const user = "user-voter-1";
      for (let i = 0; i < 10; i++) {
        const res = await checkRateLimit("vote_user", user);
        assert.equal(res.success, true);
      }
      // 11th request should be blocked for the same user
      const blockedUser = await checkRateLimit("vote_user", user);
      assert.equal(blockedUser.success, false);
      assert.equal(blockedUser.remaining, 0);

      // A different user on the SAME or DIFFERENT IP should still be allowed
      const anotherUser = "user-voter-2";
      const allowed = await checkRateLimit("vote_user", anotherUser);
      assert.equal(allowed.success, true);
    });

    it("enforces IP limit independently from User (30 req/min/IP)", async () => {
      const ip = "198.51.100.99";
      for (let i = 0; i < 30; i++) {
        const res = await checkRateLimit("vote_ip", ip);
        assert.equal(res.success, true);
      }
      // 31st request from same IP should be blocked even with different accounts
      const blockedIp = await checkRateLimit("vote_ip", ip);
      assert.equal(blockedIp.success, false);

      // A request from another IP should still be allowed
      const differentIp = "198.51.100.100";
      const allowedIp = await checkRateLimit("vote_ip", differentIp);
      assert.equal(allowedIp.success, true);
    });

    it("same user from different IP remains constrained by user limiter", async () => {
      const user = "traveling-user";
      for (let i = 0; i < 10; i++) {
        await checkRateLimit("vote_user", user);
      }
      const attempt = await checkRateLimit("vote_user", user);
      assert.equal(attempt.success, false);
    });
  });

  describe("4. Authentication Rate Limiter (10 req/min/IP)", () => {
    it("allows up to 10 auth mutation requests and rejects the 11th", async () => {
      const ip = "192.168.10.5";
      for (let i = 0; i < 10; i++) {
        const res = await checkRateLimit("auth_ip", ip);
        assert.equal(res.success, true);
      }
      const blocked = await checkRateLimit("auth_ip", ip);
      assert.equal(blocked.success, false);
      assert.equal(blocked.limit, 10);
    });
  });

  describe("5. Admin Mutation Rate Limiter (10 req/min/admin user & 20 req/min/IP)", () => {
    it("enforces 10 requests per minute on admin user mutations", async () => {
      const adminId = "admin-boss-99";
      for (let i = 0; i < 10; i++) {
        const res = await checkRateLimit("admin_user", adminId);
        assert.equal(res.success, true);
      }
      const blocked = await checkRateLimit("admin_user", adminId);
      assert.equal(blocked.success, false);
      assert.equal(blocked.remaining, 0);
    });

    it("enforces 20 requests per minute on admin mutation IP", async () => {
      const adminIp = "10.10.10.1";
      for (let i = 0; i < 20; i++) {
        const res = await checkRateLimit("admin_ip", adminIp);
        assert.equal(res.success, true);
      }
      const blocked = await checkRateLimit("admin_ip", adminIp);
      assert.equal(blocked.success, false);
    });
  });

  describe("6. Privacy & Identifier Masking", () => {
    it("properly masks IPv4 addresses", () => {
      assert.equal(maskIdentifier("103.45.22.10"), "103.*.*.10");
    });

    it("properly masks user IDs", () => {
      assert.equal(maskIdentifier("usr_123456789"), "usr_...89");
    });
  });

  describe("7. Response Shape & Clean Output", () => {
    it("formats 429 response without leaking internal Redis specifics", async () => {
      const res = createRateLimitResponse(
        { limit: 60, remaining: 0, reset: Date.now() + 30000 },
        "Too many requests",
      );
      assert.equal(res.status, 429);
      const data = await res.json();
      assert.deepEqual(data, {
        error: "RATE_LIMITED",
        message: "Too many requests",
      });
      assert.equal(res.headers.get("X-RateLimit-Limit"), "60");
      assert.equal(res.headers.get("X-RateLimit-Remaining"), "0");
      assert.ok(res.headers.get("X-RateLimit-Reset"));
      assert.ok(res.headers.get("Retry-After"));
    });
  });
});
