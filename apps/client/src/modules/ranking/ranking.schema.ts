import { z } from "zod";

export const GetRankingQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(300).default(50),
  page: z.coerce.number().int().min(1).default(1),
  search: z.string().optional(),
});

export type GetRankingQuery = z.infer<typeof GetRankingQuerySchema>;
