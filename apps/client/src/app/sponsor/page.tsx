import type { Metadata } from "next";
import { headers } from "next/headers";
import { CheckCircle2, CreditCard, LayoutPanelTop } from "lucide-react";
import { GlobalPageLayout } from "@/components/layout/global-page-layout";
import { auth } from "@/lib/auth";
import { client } from "@/lib/db";

export const metadata: Metadata = {
  title: "Sponsor Dashboard | CountryRank",
  description: "Manage your CountryRank sponsor cards and advertising slots.",
};

export const dynamic = "force-dynamic";

export default async function SponsorPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  const dashboard = session
    ? await client.user.findUnique({
        where: { id: session.user.id },
        select: {
          role: true,
          payments: {
            where: {
              status: "COMPLETED",
              voteQuantity: null,
            },
            select: {
              id: true,
              sponsorBillingCycle: { select: { id: true } },
            },
          },
          sponsors: {
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              name: true,
              description: true,
              website: true,
              slots: {
                where: { isActive: true },
                select: { id: true },
              },
            },
          },
        },
      })
    : null;

  const unassignedPurchases =
    dashboard?.payments.filter((payment) => !payment.sponsorBillingCycle)
      .length ?? 0;

  return (
    <GlobalPageLayout>
      <section className="flex min-h-0 flex-1 flex-col overflow-y-auto rounded-2xl border border-white/[0.08] bg-[#0d0d0e] p-6">
        <div className="border-b border-white/[0.08] pb-5">
          <p className="font-mono text-[10px] tracking-widest text-amber-400 uppercase">
            Sponsor workspace
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-white">
            Cards and advertising slots
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Configure sponsor cards and connect them to purchased slots.
          </p>
        </div>

        {!session ? (
          <div className="my-auto rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-6 text-center">
            <CheckCircle2 className="mx-auto size-8 text-amber-400" />
            <h2 className="mt-3 font-semibold text-white">Payment received</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Sign in with the same email used at checkout to manage your
              sponsor card and slot.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 py-5 sm:grid-cols-2">
            <div className="rounded-xl border border-white/[0.08] bg-black/20 p-5">
              <CreditCard className="size-5 text-amber-400" />
              <p className="mt-3 text-2xl font-semibold text-white">
                {unassignedPurchases}
              </p>
              <p className="text-xs text-zinc-400">Unassigned paid slots</p>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-black/20 p-5">
              <LayoutPanelTop className="size-5 text-emerald-400" />
              <p className="mt-3 text-2xl font-semibold text-white">
                {dashboard?.sponsors.length ?? 0}
              </p>
              <p className="text-xs text-zinc-400">Sponsor cards</p>
            </div>

            {dashboard?.sponsors.map((sponsor) => (
              <article
                key={sponsor.id}
                className="rounded-xl border border-white/[0.08] bg-black/20 p-5 sm:col-span-2"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-semibold text-white">{sponsor.name}</h2>
                    <p className="mt-1 text-xs text-zinc-400">
                      {sponsor.description || sponsor.website}
                    </p>
                  </div>
                  <span className="font-mono text-[10px] text-zinc-500 uppercase">
                    {sponsor.slots.length > 0 ? "Active" : "Draft"}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </GlobalPageLayout>
  );
}
