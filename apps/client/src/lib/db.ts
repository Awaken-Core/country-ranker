import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { env } from "./env"

const connectionString = env.DATABASE_URL;

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

if (!connectionString && process.env.NODE_ENV === "production") {
    throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({
    connectionString: connectionString || "postgresql://postgres:postgres@localhost:5432/postgres"
});

export const client = globalForPrisma.prisma ?? new PrismaClient({ adapter });