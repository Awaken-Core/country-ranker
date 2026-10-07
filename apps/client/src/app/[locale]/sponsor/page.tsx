import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { GlobalPageLayout } from "@/components/layout/global-page-layout";
import { SponsorManagementForm } from "@/components/sponsor/sponsor-management-form";
import { auth } from "@/lib/auth";
import { client } from "@/lib/db";
import { localePath } from "@/i18n/routing";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("UI");
  return {
    title: `${t("sponsorWorkspace")} | CountryRank`,
    description: t("sponsorDescription"),
  };
}

export const dynamic = "force-dynamic";

export default async function SponsorPage() {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("UI")]);
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect(localePath(locale));

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

  if (customer?.role !== "CUSTOMER") redirect(localePath(locale));

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
            {t("sponsorWorkspace")}
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-white">
            {t("sponsorCards")}
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            {t("sponsorDescription")}
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
