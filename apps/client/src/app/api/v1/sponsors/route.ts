import { NextResponse } from "next/server";
import { sponsorService } from "@/modules/sponsors/sponsor.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sponsors = await sponsorService.getActiveSponsors();

    return NextResponse.json(sponsors, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("GET /api/v1/sponsors error:", error);

    return NextResponse.json(
      { error: "Unable to load sponsors" },
      { status: 500 },
    );
  }
}
