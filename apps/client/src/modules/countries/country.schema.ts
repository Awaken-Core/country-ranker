import { z } from "zod";

export const CountryCodeSchema = z.string().length(2).toUpperCase();
export const CountrySlugSchema = z.string().min(1).toLowerCase();

export const GetCountriesQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(300).default(50),
});

export type GetCountriesQuery = z.infer<typeof GetCountriesQuerySchema>;
