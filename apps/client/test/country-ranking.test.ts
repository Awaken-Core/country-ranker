import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CountryService } from "../src/modules/countries/country.service";
import { RankingService } from "../src/modules/ranking/ranking.service";
import { CountryRepository } from "../src/modules/countries/country.repository";
import { RankingRepository } from "../src/modules/ranking/ranking.repository";

// In-memory mock repositories for deterministic unit testing
class MockCountryRepository extends CountryRepository {
  private countries = [
    {
      id: "1",
      name: "India",
      code: "IN",
      slug: "india",
      flag: "in",
      totalUpvoteCount: BigInt(500),
      totalDownvoteCount: BigInt(10),
      createdAt: new Date(),
    },
    {
      id: "2",
      name: "United States",
      code: "US",
      slug: "united-states",
      flag: "us",
      totalUpvoteCount: BigInt(300),
      totalDownvoteCount: BigInt(5),
      createdAt: new Date(),
    },
    {
      id: "3",
      name: "Japan",
      code: "JP",
      slug: "japan",
      flag: "jp",
      totalUpvoteCount: BigInt(500), // Tie with India on upvotes
      totalDownvoteCount: BigInt(2),
      createdAt: new Date(),
    },
    {
      id: "4",
      name: "Zero Nation",
      code: "ZN",
      slug: "zero-nation",
      flag: "zn",
      totalUpvoteCount: BigInt(0),
      totalDownvoteCount: BigInt(0),
      createdAt: new Date(),
    },
  ];

  async findAll(params?: { search?: string; skip?: number; take?: number }) {
    let list = [...this.countries];
    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          c.slug.toLowerCase().includes(q)
      );
    }
    const skip = params?.skip ?? 0;
    const take = params?.take ?? list.length;
    return list.slice(skip, skip + take);
  }

  async count(params?: { search?: string }) {
    const list = await this.findAll({ search: params?.search });
    return list.length;
  }

  async findBySlug(slug: string) {
    return this.countries.find((c) => c.slug === slug.toLowerCase()) ?? null;
  }

  async findByCode(code: string) {
    return this.countries.find((c) => c.code === code.toUpperCase()) ?? null;
  }

  async findById(id: string) {
    return this.countries.find((c) => c.id === id) ?? null;
  }
}

class MockRankingRepository extends RankingRepository {
  private countries = [
    {
      id: "country-1",
      name: "India",
      code: "IN",
      slug: "india",
      flag: "in",
      totalUpvoteCount: BigInt(500),
      totalDownvoteCount: BigInt(10),
    },
    {
      id: "country-2",
      name: "Japan",
      code: "JP",
      slug: "japan",
      flag: "jp",
      totalUpvoteCount: BigInt(500), // Same upvote count, but id is higher than country-1
      totalDownvoteCount: BigInt(2),
    },
    {
      id: "country-3",
      name: "United States",
      code: "US",
      slug: "united-states",
      flag: "us",
      totalUpvoteCount: BigInt(300),
      totalDownvoteCount: BigInt(20),
    },
    {
      id: "country-4",
      name: "Norway",
      code: "NO",
      slug: "norway",
      flag: "no",
      totalUpvoteCount: BigInt(0),
      totalDownvoteCount: BigInt(0),
    },
  ];

  async getRankedCountries(params?: { search?: string; skip?: number; take?: number }) {
    // Deterministic sort: higher totalUpvoteCount first, secondary id ASC
    const sorted = [...this.countries].sort((a, b) => {
      if (b.totalUpvoteCount !== a.totalUpvoteCount) {
        return Number(b.totalUpvoteCount - a.totalUpvoteCount);
      }
      return a.id.localeCompare(b.id);
    });

    const skip = params?.skip ?? 0;
    const take = params?.take ?? sorted.length;
    return sorted.slice(skip, skip + take);
  }

  async count(params?: { search?: string }) {
    return this.countries.length;
  }

  async getCountryRankById(id: string) {
    const sorted = await this.getRankedCountries();
    const index = sorted.findIndex((c) => c.id === id);
    return index >= 0 ? index + 1 : null;
  }
}

describe("Country Module Unit Tests", () => {
  const service = new CountryService(new MockCountryRepository());

  it("should get all countries with pagination", async () => {
    const result = await service.getAllCountries({ limit: 10 });
    assert.equal(result.data.length, 4);
    assert.equal(result.pagination.total, 4);
  });

  it("should search country by name case-insensitively", async () => {
    const result = await service.getAllCountries({ search: "india" });
    assert.equal(result.data.length, 1);
    assert.equal(result.data[0].code, "IN");
  });

  it("should get country by slug", async () => {
    const country = await service.getCountryBySlug("united-states");
    assert.ok(country);
    assert.equal(country.name, "United States");
  });

  it("should return null for non-existent slug", async () => {
    const country = await service.getCountryBySlug("atlantis");
    assert.equal(country, null);
  });

  it("should get country by ISO alpha-2 code", async () => {
    const country = await service.getCountryByCode("jp");
    assert.ok(country);
    assert.equal(country.name, "Japan");
  });
});

describe("Ranking Module Unit Tests", () => {
  const service = new RankingService(new MockRankingRepository());

  it("should rank by highest total upvotes first", async () => {
    const ranking = await service.getLiveRanking({ limit: 10 });
    assert.equal(ranking.data[0].country.code, "IN"); // 500 upvotes, id 'country-1'
    assert.equal(ranking.data[1].country.code, "JP"); // 500 upvotes, id 'country-2'
    assert.equal(ranking.data[2].country.code, "US"); // 300 upvotes
    assert.equal(ranking.data[3].country.code, "NO"); // 0 upvotes
  });

  it("should apply deterministic tie-breaking for equal upvote counts", async () => {
    const ranking = await service.getLiveRanking({ limit: 10 });
    assert.equal(ranking.data[0].rank, 1);
    assert.equal(ranking.data[1].rank, 2);
    assert.equal(ranking.data[0].upvotes, ranking.data[1].upvotes);
    assert.equal(ranking.data[0].country.id, "country-1");
  });

  it("should calculate exact rank of an individual country", async () => {
    const rankNorway = await service.getCountryRank("country-4");
    assert.equal(rankNorway, 4);

    const rankIndia = await service.getCountryRank("country-1");
    assert.equal(rankIndia, 1);
  });

  it("should keep totalDownvotes independent without subtracting", async () => {
    const ranking = await service.getLiveRanking({ limit: 10 });
    const india = ranking.data.find((c) => c.country.code === "IN");
    assert.ok(india);
    assert.equal(india.upvotes, 500);
    assert.equal(india.downvotes, 10);
  });
});
