import { sponsorRepository, SponsorRepository } from "./sponsor.repository";
import { SPONSOR_CAPACITY } from "./sponsor.constants";
import type { ActiveSponsorsResult } from "./sponsor.types";

export class SponsorService {
  constructor(
    private readonly repository: SponsorRepository = sponsorRepository,
  ) {}

  async getActiveSponsors(): Promise<ActiveSponsorsResult> {
    const slots = await this.repository.getActiveSlots(SPONSOR_CAPACITY);

    return {
      data: slots.flatMap(({ id, position, sponsor }) =>
        sponsor
          ? [
              {
                slotId: id,
                position,
                sponsorId: sponsor.id,
                name: sponsor.name,
                description: sponsor.description,
                logo: sponsor.logo,
                bgColor: sponsor.bgColor,
                textColor: sponsor.textColor,
                website: sponsor.website,
              },
            ]
          : [],
      ),
      capacity: SPONSOR_CAPACITY,
      available: SPONSOR_CAPACITY - slots.length,
    };
  }
}

export const sponsorService = new SponsorService();
