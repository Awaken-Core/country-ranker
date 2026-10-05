import { NextRequest, NextResponse } from "next/server";
import { countryService } from "@/modules/countries/country.service";
import { rankingService } from "@/modules/ranking/ranking.service";
import { CountrySlugSchema } from "@/modules/countries/country.schema";

interface Context {
  params: Promise<{ slug: string }>;
}

export async function GET(request: NextRequest, context: Context) {
  try {
    const { slug } = await context.params;
    const parsedSlug = CountrySlugSchema.safeParse(slug);

    if (!parsedSlug.success) {
      return NextResponse.json(
        { error: "Invalid country slug" },
        { status: 400 },
      );
    }

    const country = await countryService.getCountryBySlug(parsedSlug.data);
    if (!country) {
      return NextResponse.json({ error: "Country not found" }, { status: 404 });
    }

    const rank = await rankingService.getCountryRank(country.id);

    return NextResponse.json({
      country,
      rank,
    });
  } catch (error) {
    console.error("GET /api/v1/countries/[slug]/ranking error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
