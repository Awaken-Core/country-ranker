import { z } from "zod";

export const EnvSchema = z.object({
    DATABASE_URL: z.string().url(),
    NEXT_PUBLIC_SITE_URL: z.string().url(),
    UPLOADTHING_TOKEN: z.string(),
});

export type WebEnv = z.infer<typeof EnvSchema>;

export const env = EnvSchema.parse({
    DATABASE_URL: process.env.DATABASE_URL,
    UPLOADTHING_TOKEN: process.env.UPLOADTHING_TOKEN,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});