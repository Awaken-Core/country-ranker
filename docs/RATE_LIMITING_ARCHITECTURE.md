# Rate Limiting System Documentation

## 1. Overview

Rate limiting controls the number of requests a client or user can send to the application within a specific period. It protects the application from automated spam, denial-of-service attempts, brute-force attacks, and abusive bot behavior while keeping normal user traffic unaffected.

In this project, rate limiting is implemented across multiple layers using Upstash Redis with a sliding window algorithm, backed by an in-memory fallback for local development and fault tolerance.

---

## 2. Why Multi-Layer Rate Limiting Is Used

A single global rate limiter is not sufficient because different endpoints carry different levels of risk:

1. Public browsing should rarely be restricted.
2. Voting directly impacts country rankings and leaderboard integrity.
3. Authentication endpoints are vulnerable to credential stuffing.
4. Admin mutation endpoints modify system-level permissions and vote totals.

Furthermore, rate limits are split between IP address and User ID rather than combining them into one string:
- If a user changes IP addresses or uses a VPN, their account is still restricted by the User ID limit.
- If an attacker creates multiple accounts from the same IP address, they are restricted by the IP limit.

---

## 3. Rate Limit Tiers and Rules

### Tier 1: General API Traffic
- Protected paths: All `/api/*` endpoints except webhooks, file uploads, and specialized endpoints.
- Identifier: Client IP (`ratelimit:api:ip:<ip>`).
- Limit: 60 requests per minute per IP.
- Enforcement location: Next.js middleware (`src/middleware.ts`).

### Tier 2: Voting Protection
- Protected endpoint: `POST /api/v1/countries/:slug/vote`.
- Layer A (IP limit): 30 requests per minute per IP (`ratelimit:vote:ip:<ip>`).
- Layer B (User limit): 10 requests per minute per authenticated user (`ratelimit:vote:user:<userId>`).
- Enforcement location: Inside the voting route handler (`src/app/api/v1/countries/[slug]/vote/route.ts`).
- Important distinction: This is an HTTP request rate limit. It does not replace the daily quota of 3 free upvotes and 3 free downvotes per UTC day, which continues to be enforced in PostgreSQL.

### Tier 3: Authentication Protection
- Protected paths: `POST /api/auth/sign-in/*`, `POST /api/auth/sign-up/*`, password reset endpoints.
- Identifier: Client IP (`ratelimit:auth:ip:<ip>`).
- Limit: 10 requests per minute per IP.
- Enforcement location: Next.js middleware (`src/middleware.ts`).

### Tier 4: Sensitive Admin Mutations
- Protected endpoints:
  - `POST /api/v1/admin/votes` (vote adjustments)
  - `POST /api/v1/admin/users` (admin creation, removal, and permission changes)
  - `PATCH /api/v1/admin/countries/:id` (country metadata updates)
- Layer A (Admin User limit): 10 mutations per minute per admin user (`ratelimit:admin:user:<userId>`).
- Layer B (IP limit safeguard): 20 requests per minute per IP (`ratelimit:admin:ip:<ip>`).
- Enforcement location: Inside each respective admin route handler before service execution.

---

## 4. Endpoints Exempt From Rate Limiting

The following paths are intentionally excluded from rate limiting:
- Static assets, JavaScript bundles, CSS files, images, and fonts (`/_next/*`, `/public/*`, `/favicon.ico`).
- Payment webhooks (`/api/v1/webhooks/dodopayments`), which require guaranteed delivery and are authenticated via cryptographic signatures.
- UploadThing file upload endpoints (`/api/v1/uploadthings`).
- Standard public web pages rendered by Next.js.

---

## 5. How Client IP Is Determined

The application extracts the client IP safely from proxy headers in the following priority order:
1. `cf-connecting-ip` (when deployed behind Cloudflare)
2. `x-real-ip` (standard reverse proxy header)
3. `x-forwarded-for` (first hop in the IP list)
4. Local fallback `127.0.0.1` (local development or tests)

---

## 6. Failure and Resilience Policy (Fail-Open)

Rate limiting is designed to prevent abuse, not cause complete system outages. If Upstash Redis is temporarily unreachable or experiences network drops:
1. The error is caught and logged with structured output.
2. The request is allowed through (fail-open behavior).
3. Critical database rules remain fully active: PostgreSQL transactions, advisory locks, Better Auth session authentication, and RBAC permission checks still guarantee that unauthorized actions and quota violations cannot succeed.

---

## 7. HTTP 429 Response Format

When any rate limit is exceeded, the server responds with HTTP status code 429:

### Response Body
```json
{
  "error": "RATE_LIMITED",
  "message": "Too many requests. Please slow down and try again later."
}
```

### Standard Response Headers
- `Retry-After`: Number of seconds to wait before retrying.
- `X-RateLimit-Limit`: Maximum requests permitted within the window.
- `X-RateLimit-Remaining`: Number of requests remaining in the current window (0 when blocked).
- `X-RateLimit-Reset`: Unix timestamp in seconds when the current window resets.

---

## 8. Directory Structure of Rate Limiting Code

```
apps/client/src/
├── middleware.ts                   # Intercepts General API and Auth IP traffic
├── lib/
│   ├── rate-limit.ts               # Barrel export for rate limiting modules
│   └── rate-limit/
│       ├── redis.ts                # Upstash Redis client singleton
│       ├── ip.ts                   # Client IP extraction utility
│       ├── response.ts             # Standardized HTTP 429 response builder
│       └── limiters.ts             # Core sliding window limiters and configurations
└── test/
    └── rate-limit.test.ts          # Unit and integration test suite
```

---

## 9. Running Tests

To run the complete test suite including rate limiting tests:

```bash
npm test
```

Or run via Node test runner directly:

```bash
npx tsx --test test/rate-limit.test.ts
```
