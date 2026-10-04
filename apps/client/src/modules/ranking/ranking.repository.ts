import { client } from "@/lib/db";
import { Prisma } from "@prisma/client";

export class RankingRepository {
  /**
   * Calculates the net score in memory from the two immutable aggregate
   * counters. No derived score is stored in the database.
   */
  async getRankedCountries(params?: {
    search?: string;
    skip?: number;
    take?: number;
  }) {
    const where: Prisma.CountryWhereInput = {};
    const q = params?.search?.trim();
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { code: { contains: q, mode: "insensitive" } },
        { slug: { contains: q, mode: "insensitive" } },
      ];
    }
    const skip = params?.skip ?? 0;
    const take = params?.take ?? Number.MAX_SAFE_INTEGER;
    const countries = await client.country.findMany({
      where,
      select: {
        id: true,
        name: true,
        code: true,
        slug: true,
        flag: true,
        totalUpvoteCount: true,
        totalDownvoteCount: true,
      },
    });

    countries.sort((a, b) => {
      const aScore = a.totalUpvoteCount - a.totalDownvoteCount;
      const bScore = b.totalUpvoteCount - b.totalDownvoteCount;
      if (aScore !== bScore) return aScore > bScore ? -1 : 1;
      return a.id.localeCompare(b.id);
    });

    return countries.slice(skip, skip + take);
  }

  async count(params?: { search?: string }) {
    const where: Prisma.CountryWhereInput = {};
    if (params?.search) {
      const q = params.search.trim();
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { code: { contains: q, mode: "insensitive" } },
        { slug: { contains: q, mode: "insensitive" } },
      ];
    }
    return client.country.count({ where });
  }

  /** Calculates a 1-based rank using the same in-memory net-score ordering. */
  async getCountryRankById(id: string) {
    const countries = await this.getRankedCountries();
    const index = countries.findIndex((country) => country.id === id);
    return index === -1 ? null : index + 1;
  }
}

export const rankingRepository = new RankingRepository();
