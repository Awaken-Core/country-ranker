import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
import { GetCountries } from "react-country-state-city";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5433/postgres?schema=public";
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const SPONSOR_LOGO_KEY = "EfsDDGpbQoL2hkAz5Qr8Rdusa3DArKnwxbyq1UkF40PQmhCo";

const sponsorDetails = [
  ["BUNCH", "We set up and manage human teams validating your AI.", "#181313"],
  ["Higgsfield", "Create AI videos and images with a world model.", "#121814"],
  ["Blotato", "Social media API and MCP for Claude and AI agents.", "#16121a"],
  [
    "Ecom Tools",
    "Premium ecommerce, AI, and SEO tools for global reach.",
    "#10141a",
  ],
  [
    "CREEM",
    "Sell software globally and grow revenue with zero code.",
    "#181215",
  ],
  [
    "Hermoso.ai",
    "AI video, images, social scheduling, and advertising.",
    "#161411",
  ],
  [
    "Chatbase",
    "AI agents for customer support and automated sales.",
    "#141414",
  ],
  ["Virlo", "Track and use short-form video performance data.", "#191217"],
  ["Linear", "Plan and build products with a streamlined workflow.", "#151521"],
  ["Raycast", "A fast, extensible launcher for productive teams.", "#171717"],
  ["Resend", "Email infrastructure designed for developers.", "#151515"],
  ["Vercel", "Build and deploy web experiences with confidence.", "#111111"],
  ["Supabase", "An open-source platform for modern applications.", "#101914"],
  ["Neon", "Serverless Postgres built for modern development.", "#111a18"],
  ["Clerk", "Authentication and user management for applications.", "#171522"],
  ["Sentry", "Application monitoring and error tracking for teams.", "#19151e"],
  [
    "PostHog",
    "Product analytics, feature flags, and session replay.",
    "#1b1712",
  ],
  [
    "Polar",
    "Funding and monetization infrastructure for developers.",
    "#121820",
  ],
  ["Dub", "Links, attribution, and growth tools for modern teams.", "#141414"],
] as const;

const sponsorSeed = sponsorDetails.map(
  ([name, description, bgColor], index) => {
    const number = String(index + 1).padStart(12, "0");

    return {
      id:
        index === 0
          ? "11111111-1111-4111-8111-111111111111"
          : `11111111-1111-4111-8111-${number}`,
      slotId:
        index === 0
          ? "22222222-2222-4222-8222-222222222222"
          : `22222222-2222-4222-8222-${number}`,
      name,
      description,
      logo: SPONSOR_LOGO_KEY,
      bgColor,
      textColor: "#f8fafc",
      website: process.env.NEXT_PUBLIC_APP_BASE_URL || "http://localhost:3000",
    };
  },
);

async function main() {
  console.log("Fetching full global ISO country dataset...");
  const rawList = await GetCountries();

  const countriesToSeed = [];
  const seenCodes = new Set<string>();
  const seenSlugs = new Set<string>();

  for (const c of rawList) {
    if (!c.iso2 || c.iso2.length !== 2) continue;
    const code = c.iso2.toUpperCase();
    if (seenCodes.has(code)) continue;

    let slug = c.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // ensure slug uniqueness in edge cases
    if (seenSlugs.has(slug)) {
      slug = `${slug}-${code.toLowerCase()}`;
    }

    seenCodes.add(code);
    seenSlugs.add(slug);

    countriesToSeed.push({
      code,
      name: c.name,
      slug,
      flag: code.toLowerCase(),
    });
  }

  console.log(
    `Starting idempotent seed for all ${countriesToSeed.length} countries...`,
  );

  // Use transaction chunks for fast and safe insertion
  const CHUNK_SIZE = 50;
  for (let i = 0; i < countriesToSeed.length; i += CHUNK_SIZE) {
    const chunk = countriesToSeed.slice(i, i + CHUNK_SIZE);
    await Promise.all(
      chunk.map((country) =>
        prisma.country.upsert({
          where: { code: country.code },
          update: {
            name: country.name,
            slug: country.slug,
            flag: country.flag,
          },
          create: {
            code: country.code,
            name: country.name,
            slug: country.slug,
            flag: country.flag,
            totalUpvoteCount: BigInt(0),
            totalDownvoteCount: BigInt(0),
          },
        }),
      ),
    );
  }

  const finalCount = await prisma.country.count();
  console.log(
    `Successfully seeded! Total countries in database: ${finalCount}`,
  );

  console.log("Starting idempotent seed for sponsors and slots...");
  for (const seed of sponsorSeed) {
    const sponsor = await prisma.sponsor.upsert({
      where: { id: seed.id },
      update: {
        name: seed.name,
        description: seed.description,
        logo: seed.logo,
        bgColor: seed.bgColor,
        textColor: seed.textColor,
        website: seed.website,
      },
      create: {
        id: seed.id,
        name: seed.name,
        description: seed.description,
        logo: seed.logo,
        bgColor: seed.bgColor,
        textColor: seed.textColor,
        website: seed.website,
      },
    });

    await prisma.slots.upsert({
      where: { id: seed.slotId },
      update: {
        sponsorId: sponsor.id,
        isActive: true,
      },
      create: {
        id: seed.slotId,
        sponsorId: sponsor.id,
        isActive: true,
      },
    });
  }

  const [sponsorCount, slotCount] = await Promise.all([
    prisma.sponsor.count(),
    prisma.slots.count(),
  ]);
  console.log(
    `Successfully seeded sponsors and slots! Totals: ${sponsorCount} sponsors, ${slotCount} slots.`,
  );
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
