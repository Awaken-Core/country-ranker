import { z } from "zod";
import { createEnv } from "@t3-oss/env-nextjs";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    NODE_ENV: z.string().min(1),
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(1),
    UPLOADTHING_TOKEN: z.string().optional(),
    // Set to "true" to require email verification before a user can vote.
    VOTING_REQUIRE_VERIFIED_EMAIL: z.string().optional(),
  },
  client: {
    NEXT_PUBLIC_APP_BASE_URL: z.string().min(1),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_APP_BASE_URL: process.env.NEXT_PUBLIC_APP_BASE_URL,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});