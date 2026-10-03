import Link from "next/link";

export default function CountryNotFound() {
  return (
    <div className="min-h-screen bg-[#0A0A0B] flex flex-col items-center justify-center p-6 text-center text-foreground">
      <div className="text-5xl mb-4">🌍</div>
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
        Country Not Found
      </h1>
      <p className="text-sm text-muted-foreground max-w-md mb-6">
        We couldn&apos;t find any country matching this URL slug. It might have been mistyped or does not exist in our sovereign records.
      </p>
      <div className="flex gap-4">
        <Link
          href="/countries"
          className="rounded-xl bg-white/[0.08] hover:bg-white/[0.14] px-4 py-2 text-xs font-semibold text-white transition-colors"
        >
          View All Countries
        </Link>
        <Link
          href="/"
          className="rounded-xl border border-white/[0.08] px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-white transition-colors"
        >
          Back to Leaderboard
        </Link>
      </div>
    </div>
  );
}
