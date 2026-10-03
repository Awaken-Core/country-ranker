import { rankingService } from "@/modules/ranking/ranking.service";
import { Leaderboard } from "@/components/ranking/leaderboard";
import { GlobalPageLayout } from "@/components/layout/global-page-layout";

export const revalidate = 30; // 30s ISR

export default async function Home() {
  const initialRankings = await rankingService.getTopCountries(300);

  return (
    <GlobalPageLayout>
      <Leaderboard initialRankings={initialRankings} />
    </GlobalPageLayout>
  );
}
