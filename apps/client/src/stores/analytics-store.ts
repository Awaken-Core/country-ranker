import { create } from 'zustand';

export interface Analytics {
  visitors: number;
  pageviews: number;
}

export async function analytics(): Promise<Analytics> {
  const res = await fetch("/api/v1/analytics/view", {
    next: {
      revalidate: 60, // cache for 1 minute
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch analytics");
  }

  const data = await res.json();

  return {
    pageviews: data.pageviews ?? 0,
    visitors: data.visitors ?? 0
  };
}

interface AnalyticsStoreType {
    analytics: Analytics;
    getAnalytics: () => Promise<Analytics>;
};

export const useAnalytics = create<AnalyticsStoreType>((set) => ({
    analytics: {
        pageviews: 0,
        visitors: 0
    },
    getAnalytics: async () => {
        const res = await analytics();
        set({ analytics: res });
        return res;
    },
}));