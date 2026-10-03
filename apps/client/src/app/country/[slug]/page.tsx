import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { countryService } from "@/modules/countries/country.service";
import { rankingService } from "@/modules/ranking/ranking.service";
import { CountryFlag } from "@/components/country-flag";
import { GlobalPageLayout } from "@/components/layout/global-page-layout";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const country = await countryService.getCountryBySlug(slug);

  if (!country) {
    return {
      title: "Country Not Found | CountryRank",
    };
  }

  return {
    title: `${country.name} (${country.code}) - Global Standing | CountryRank`,
    description: `Track ${country.name}'s verified standing on the global country leaderboard with ${country.totalUpvotes.toLocaleString()} upvotes.`,
  };
}

export default async function CountryDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const country = await countryService.getCountryBySlug(slug);

  if (!country) {
    notFound();
  }

  const rank = await rankingService.getCountryRank(country.id);
  const formattedRank = rank ? `#${rank}` : "--";

  return (
    <GlobalPageLayout>
      <div className="w-full flex-1 min-h-0 flex flex-col justify-start">
        {/* Navigation Breadcrumb */}
        <div className="shrink-0 mb-3 flex items-center justify-between font-mono text-xs">
          <Link
            href="/"
            className="text-zinc-500 hover:text-white transition-colors"
          >
            ← Back to Leaderboard
          </Link>
          <Link
            href="/countries"
            className="text-zinc-500 hover:text-white transition-colors"
          >
            All Countries →
          </Link>
        </div>

        {/* Self-contained profile card */}
        <div className="rounded-xl border border-white/[0.08] bg-[#0C0C0C] p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-5 pb-5 border-b border-white/[0.06]">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <CountryFlag
                code={country.code}
                size="xl"
                className="rounded-[2px] shadow-sm"
              />
              <div>
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                    {country.name}
                  </h1>
                  <span className="font-mono text-xs text-zinc-500 uppercase">
                    {country.code}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Verified sovereign entity
                </p>
              </div>
            </div>

            {/* Compact Rank Display */}
            <div className="text-center sm:text-right">
              <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-500 mb-0.5">
                Current Rank
              </div>
              <div className="font-mono text-2xl sm:text-3xl font-extrabold text-white">
                {formattedRank}
              </div>
            </div>
          </div>

          {/* Metric Details */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-5">
            <div className="p-3 rounded-lg bg-[#080808] border border-white/[0.04]">
              <div className="font-mono text-[10px] text-zinc-500 uppercase">Upvotes</div>
              <div className="font-mono text-base sm:text-lg font-bold text-white mt-1">
                {country.totalUpvotes.toLocaleString()}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#080808] border border-white/[0.04]">
              <div className="font-mono text-[10px] text-zinc-500 uppercase">Downvotes</div>
              <div className="font-mono text-base sm:text-lg font-bold text-zinc-400 mt-1">
                {country.totalDownvotes.toLocaleString()}
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1 p-3 rounded-lg bg-[#080808] border border-white/[0.04]">
              <div className="font-mono text-[10px] text-zinc-500 uppercase">Trend</div>
              <div className="font-mono text-base sm:text-lg font-bold text-emerald-400 mt-1">
                Active (—)
              </div>
            </div>
          </div>

          {/* Voting Placeholder */}
          <div className="p-4 rounded-lg border border-dashed border-white/[0.06] bg-[#080808] text-center font-mono">
            <p className="text-xs text-zinc-400">
              Voting will be unlocked in the next milestone. 3 free votes/day per user.
            </p>
          </div>
        </div>
      </div>
    </GlobalPageLayout>
  );
}
