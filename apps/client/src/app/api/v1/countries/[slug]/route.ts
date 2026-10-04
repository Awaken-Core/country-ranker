import { NextRequest, NextResponse } from "next/server";
import { countryService } from "@/modules/countries/country.service";
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

    return NextResponse.json(country);
  } catch (error) {
    console.error("GET /api/v1/countries/[slug] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
