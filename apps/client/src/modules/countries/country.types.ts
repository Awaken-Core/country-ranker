export interface CountryDTO {
  id: string;
  name: string;
  code: string;
  slug: string;
  flag: string;
  totalUpvotes: number;
  totalDownvotes: number;
  createdAt: string;
}

export interface CountryWithRankDTO extends CountryDTO {
  rank: number;
}
