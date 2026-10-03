export interface RankedCountryDTO {
  rank: number;
  country: {
    id: string;
    name: string;
    slug: string;
    code: string;
    flag: string;
  };
  upvotes: number;
  downvotes: number;
}

export interface LiveRankingResult {
  data: RankedCountryDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
