import { NextRequest, NextResponse } from "next/server";
import { countryService } from "@/modules/countries/country.service";
import { GetCountriesQuerySchema } from "@/modules/countries/country.schema";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = GetCountriesQuerySchema.safeParse({
      search: searchParams.get("search") || undefined,
      page: searchParams.get("page") || undefined,
      limit: searchParams.get("limit") || undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const result = await countryService.getAllCountries(parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/v1/countries error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
