export interface SponsorSlotDTO {
  slotId: string;
  position: number | null;
  sponsorId: string;
  name: string;
  description: string | null;
  logo: string;
  bgColor: string | null;
  textColor: string | null;
  website: string;
}

export interface ActiveSponsorsResult {
  data: SponsorSlotDTO[];
  capacity: number;
  available: number;
}
