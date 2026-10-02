import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma"
import { client } from "./db";
import { env } from "./env";

export const auth = betterAuth({
    baseURL: env.NEXT_PUBLIC_APP_BASE_URL,
    database: prismaAdapter(client, {
        provider: "postgresql",
    }),

    emailAndPassword: {
        enabled: true, // Enable authentication using email and password.
    },
    socialProviders: {
        google: {
            clientId: env.GOOGLE_CLIENT_ID!,
            clientSecret: env.GOOGLE_CLIENT_SECRET!,
        }
    },

    trustedOrigins: [
        env.NEXT_PUBLIC_APP_BASE_URL!,
    ],
});