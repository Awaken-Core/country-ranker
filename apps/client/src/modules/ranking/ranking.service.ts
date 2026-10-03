import { rankingRepository, RankingRepository } from "./ranking.repository";
import { LiveRankingResult, RankedCountryDTO } from "./ranking.types";

export class RankingService {
  constructor(private repo: RankingRepository = rankingRepository) {}

  async getLiveRanking(params?: {
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<LiveRankingResult> {
    const page = params?.page && params.page > 0 ? params.page : 1;
    const limit = params?.limit && params.limit > 0 ? params.limit : 50;
    const skip = (page - 1) * limit;

    try {
      const [items, total] = await Promise.all([
        this.repo.getRankedCountries({ search: params?.search, skip, take: limit }),
        this.repo.count({ search: params?.search }),
      ]);

      const data: RankedCountryDTO[] = items.map((item, index) => ({
        rank: skip + index + 1,
        country: {
          id: item.id,
          name: item.name,
          slug: item.slug,
          code: item.code,
          flag: item.flag,
        },
        upvotes: Number(item.totalUpvoteCount),
        downvotes: Number(item.totalDownvoteCount),
      }));

      return {
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.warn("Could not fetch rankings from DB (offline or building):", error);
      return {
        data: [],
        pagination: {
          page: 1,
          limit,
          total: 0,
          totalPages: 0,
        },
      };
    }
  }

  async getTopCountries(limit: number = 10): Promise<RankedCountryDTO[]> {
    const result = await this.getLiveRanking({ page: 1, limit });
    return result.data;
  }

  async getCountryRank(countryId: string): Promise<number | null> {
    return this.repo.getCountryRankById(countryId);
  }
}

export const rankingService = new RankingService();
