import type { Metadata } from "next";
import { GlobalPageLayout } from "@/components/layout/global-page-layout";
import TermsAndConditions from "../terms-and-conditions";

export const metadata: Metadata = {
  title: "How It Works & Terms | RankMyCountry",
  description: "Learn how RankMyCountry works and read our terms and conditions.",
};

export default function TermsPage() {
  return (
    <GlobalPageLayout>
      <TermsAndConditions />
    </GlobalPageLayout>
  );
}
