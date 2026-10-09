import { countryRepository, CountryRepository } from "./country.repository";
import { CountryDTO } from "./country.types";

export class CountryService {
  constructor(private repo: CountryRepository = countryRepository) {}

  private mapToDTO(item: {
    id: string;
    name: string;
    code: string;
    slug: string;
    flag: string;
    totalUpvoteCount: bigint;
    totalDownvoteCount: bigint;
    createdAt: Date;
  }): CountryDTO {
    return {
      id: item.id,
      name: item.name,
      code: item.code,
      slug: item.slug,
      flag: item.flag,
      totalUpvotes: Number(item.totalUpvoteCount),
      totalDownvotes: Number(item.totalDownvoteCount),
      createdAt: item.createdAt.toISOString(),
    };
  }

  async getAllCountries(params?: {
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = params?.page && params.page > 0 ? params.page : 1;
    const limit = params?.limit && params.limit > 0 ? params.limit : 50;
    const skip = (page - 1) * limit;

    try {
      const [items, total] = await Promise.all([
        this.repo.findAll({ search: params?.search, skip, take: limit }),
        this.repo.count({ search: params?.search }),
      ]);

      return {
        data: items.map((c) => this.mapToDTO(c)),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.warn(
        "Could not fetch countries from DB (offline or building):",
        error,
      );
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

  async getCountryBySlug(slug: string): Promise<CountryDTO | null> {
    if (!slug) return null;
    try {
      const item = await this.repo.findBySlug(slug);
      if (!item) return null;
      return this.mapToDTO(item);
    } catch (error) {
      console.warn(`Could not fetch country slug "${slug}" (offline or error):`, error);
      return null;
    }
  }

  async getCountryByCode(code: string): Promise<CountryDTO | null> {
    if (!code) return null;
    try {
      const item = await this.repo.findByCode(code);
      if (!item) return null;
      return this.mapToDTO(item);
    } catch (error) {
      console.warn(`Could not fetch country code "${code}" (offline or error):`, error);
      return null;
    }
  }

  async getCountryById(id: string): Promise<CountryDTO | null> {
    if (!id) return null;
    try {
      const item = await this.repo.findById(id);
      if (!item) return null;
      return this.mapToDTO(item);
    } catch (error) {
      console.warn(`Could not fetch country id "${id}" (offline or error):`, error);
      return null;
    }
  }
}

export const countryService = new CountryService();
