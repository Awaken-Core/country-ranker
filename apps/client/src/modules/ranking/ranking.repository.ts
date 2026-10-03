import { client } from "@/lib/db";
import { Prisma } from "@prisma/client";

export class RankingRepository {
  /**
   * Returns countries ordered deterministically:
   * Higher totalUpvoteCount first.
   * On tie, secondary deterministic ordering by id ASC.
   */
  async getRankedCountries(params?: {
    search?: string;
    skip?: number;
    take?: number;
  }) {
    const where: Prisma.CountryWhereInput = {};

    if (params?.search) {
      const q = params.search.trim();
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { code: { contains: q, mode: "insensitive" } },
        { slug: { contains: q, mode: "insensitive" } },
      ];
    }

    return client.country.findMany({
      where,
      skip: params?.skip,
      take: params?.take,
      orderBy: [
        { totalUpvoteCount: "desc" },
        { id: "asc" },
      ],
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

  /**
   * Calculates the 1-based rank of a country based on:
   * higher totalUpvoteCount, or equal totalUpvoteCount and smaller id.
   */
  async getCountryRankById(id: string) {
    const country = await client.country.findUnique({
      where: { id },
      select: { id: true, totalUpvoteCount: true },
    });

    if (!country) return null;

    // Count how many countries rank strictly ahead of this country:
    // 1) totalUpvoteCount > country.totalUpvoteCount
    // OR 2) totalUpvoteCount == country.totalUpvoteCount AND id < country.id
    const aheadCount = await client.country.count({
      where: {
        OR: [
          { totalUpvoteCount: { gt: country.totalUpvoteCount } },
          {
            AND: [
              { totalUpvoteCount: country.totalUpvoteCount },
              { id: { lt: country.id } },
            ],
          },
        ],
      },
    });

    return aheadCount + 1;
  }
}

export const rankingRepository = new RankingRepository();
