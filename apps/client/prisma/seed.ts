import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
import { GetCountries } from "react-country-state-city";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5433/postgres?schema=public";
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

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
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
