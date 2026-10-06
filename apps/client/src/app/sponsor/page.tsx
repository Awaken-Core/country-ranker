import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { GlobalPageLayout } from "@/components/layout/global-page-layout";
import { SponsorManagementForm } from "@/components/sponsor/sponsor-management-form";
import { auth } from "@/lib/auth";
import { client } from "@/lib/db";

export const metadata: Metadata = {
  title: "Sponsor Dashboard | CountryRank",
  description: "Manage your CountryRank sponsor card and advertising slot.",
};

export const dynamic = "force-dynamic";

export default async function SponsorPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/");

  const customer = await client.user.findUnique({
    where: { id: session.user.id },
    select: {
      role: true,
      sponsors: {
        select: {
          id: true,
          name: true,
          description: true,
          logo: true,
          bgColor: true,
          textColor: true,
          website: true,
          slots: {
            orderBy: { createdAt: "asc" },
            take: 1,
            select: {
              isActive: true,
              sponsorBillingCycles: {
                orderBy: { endDate: "desc" },
                take: 1,
                select: { endDate: true, status: true },
              },
            },
          },
        },
      },
    },
  });

  if (customer?.role !== "CUSTOMER") redirect("/");

  const sponsor = customer.sponsors;
  const slot = sponsor?.slots[0] ?? null;
  const billingCycle = slot?.sponsorBillingCycles[0] ?? null;
  const billingCycleActive = Boolean(
    billingCycle?.status === "ACTIVE" && billingCycle.endDate > new Date(),
  );
  const billingEndsAt =
    billingCycle?.endDate.toISOString() ?? null;

  return (
    <GlobalPageLayout>
      <section className="flex min-h-0 flex-1 flex-col rounded-2xl border border-white/[0.08] bg-[#0d0d0e] p-6">
        <div className="shrink-0 border-b border-white/[0.08] pb-5">
          <p className="font-mono text-[10px] tracking-widest text-amber-400 uppercase">
            Sponsor workspace
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-white">
            Manage your sponsor card
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Update the card shown in your active advertising slot.
          </p>
        </div>

        <SponsorManagementForm
          initialSponsor={sponsor}
          activeSlot={Boolean(slot?.isActive)}
          billingCycleActive={billingCycleActive}
          billingEndsAt={billingEndsAt}
        />
      </section>
    </GlobalPageLayout>
  );
}
