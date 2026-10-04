import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, TrendingUp, ThumbsUp, ThumbsDown } from "lucide-react";
import { countryService } from "@/modules/countries/country.service";
import { rankingService } from "@/modules/ranking/ranking.service";
import { CountryFlag } from "@/components/country-flag";
import { GlobalPageLayout } from "@/components/layout/global-page-layout";
import { VotingPanel } from "@/components/voting/voting-panel";

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
      <div className="w-full flex-1 min-h-0 flex flex-col justify-start font-sans">
        {/* Navigation Breadcrumb */}
        <div className="shrink-0 mb-3 flex items-center justify-between text-xs">
          <Link
            href="/"
            className="group inline-flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span>Leaderboard</span>
          </Link>
          <Link
            href="/countries"
            className="group inline-flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors"
          >
            <span>All Countries</span>
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Self-contained profile card */}
        <div className="rounded-xl border border-white/[0.08] bg-[#0C0C0C] p-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-5 pb-5 border-b border-white/[0.06]">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <CountryFlag
                code={country.code}
                size="xl"
                className="rounded-[3px] shadow-md shrink-0"
              />
              <div>
                <div className="flex items-center gap-2.5 justify-center sm:justify-start">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                    {country.name}
                  </h1>
                  <span className="font-mono text-xs text-zinc-400 uppercase tracking-wider bg-white/[0.05] px-1.5 py-0.5 rounded border border-white/[0.08]">
                    {country.code}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  Verified sovereign entity ledger
                </p>
              </div>
            </div>

            {/* Compact Rank Display */}
            <div className="text-center sm:text-right bg-[#080808] px-4 py-2.5 rounded-lg border border-white/[0.06]">
              <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 mb-0.5">
                Current Standing
              </div>
              <div className="font-mono text-2xl sm:text-3xl font-extrabold text-white">
                {formattedRank}
              </div>
            </div>
          </div>

          {/* Metric Details */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-5">
            <div className="p-3.5 rounded-lg bg-[#080808] border border-white/[0.05] hover:border-white/[0.1] transition-colors">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider">Upvotes</span>
                <ThumbsUp className="size-3 text-emerald-400" />
              </div>
              <div className="font-mono text-base sm:text-lg font-bold text-white mt-1 tabular-nums">
                {country.totalUpvotes.toLocaleString()}
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-[#080808] border border-white/[0.05] hover:border-white/[0.1] transition-colors">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider">Downvotes</span>
                <ThumbsDown className="size-3 text-red-400" />
              </div>
              <div className="font-mono text-base sm:text-lg font-bold text-zinc-400 mt-1 tabular-nums">
                {country.totalDownvotes.toLocaleString()}
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1 p-3.5 rounded-lg bg-[#080808] border border-white/[0.05] hover:border-white/[0.1] transition-colors">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider">Trend</span>
                <TrendingUp className="size-3 text-emerald-400" />
              </div>
              <div className="font-mono text-base sm:text-lg font-bold text-emerald-400 mt-1">
                Active
              </div>
            </div>
          </div>

          {/* Voting */}
          <VotingPanel
            slug={country.slug}
            initialUpvotes={country.totalUpvotes}
            initialDownvotes={country.totalDownvotes}
          />
        </div>
      </div>
    </GlobalPageLayout>
  );
}
