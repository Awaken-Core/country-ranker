import { client } from "@/lib/db";

export class SponsorRepository {
  getActiveSlots(limit: number) {
    return client.slots.findMany({
      where: {
        isActive: true,
      },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }, { id: "asc" }],
      take: limit,
      select: {
        id: true,
        position: true,
        sponsor: {
          select: {
            id: true,
            name: true,
            description: true,
            logo: true,
            bgColor: true,
            textColor: true,
            website: true,
          },
        },
      },
    });
  }
}

export const sponsorRepository = new SponsorRepository();
