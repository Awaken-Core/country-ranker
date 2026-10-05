export { SPONSOR_CAPACITY } from "@/modules/sponsors/sponsor.constants";
export const VISIBLE_ADS_PER_RAIL = 5;

export interface SponsorAd {
  slotId: string;
  sponsorId: string;
  name: string;
  description: string | null;
  logo: string;
  bgColor: string | null;
  textColor: string | null;
  website: string;
}

export interface SponsorsResponse {
  data: SponsorAd[];
  capacity: number;
  available: number;
}

export interface AvailableAdSlot {
  id: "available-slot";
  available: number;
}

export type AdItem = SponsorAd | AvailableAdSlot;

export function isAvailableAd(ad: AdItem): ad is AvailableAdSlot {
  return "available" in ad;
}
