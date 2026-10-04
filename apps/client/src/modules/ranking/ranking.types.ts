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
  /** The leaderboard value: every downvote offsets one upvote. */
  score: number;
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
