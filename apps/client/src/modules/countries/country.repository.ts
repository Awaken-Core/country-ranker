import { client } from "@/lib/db";
import { Prisma } from "@prisma/client";

export class CountryRepository {
  async findAll(params?: { search?: string; skip?: number; take?: number }) {
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
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        code: true,
        slug: true,
        flag: true,
        totalUpvoteCount: true,
        totalDownvoteCount: true,
        createdAt: true,
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

  async findBySlug(slug: string) {
    return client.country.findUnique({
      where: { slug: slug.toLowerCase() },
      select: {
        id: true,
        name: true,
        code: true,
        slug: true,
        flag: true,
        totalUpvoteCount: true,
        totalDownvoteCount: true,
        createdAt: true,
      },
    });
  }

  async findByCode(code: string) {
    return client.country.findUnique({
      where: { code: code.toUpperCase() },
      select: {
        id: true,
        name: true,
        code: true,
        slug: true,
        flag: true,
        totalUpvoteCount: true,
        totalDownvoteCount: true,
        createdAt: true,
      },
    });
  }

  async findById(id: string) {
    return client.country.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        code: true,
        slug: true,
        flag: true,
        totalUpvoteCount: true,
        totalDownvoteCount: true,
        createdAt: true,
      },
    });
  }
}

export const countryRepository = new CountryRepository();
