"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAdminStore } from "@/stores/use-admin-store";
import { VoteLogItem } from "@/modules/admin/admin.types";
import { CountryFlag } from "@/components/country-flag";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, RefreshCw, Filter, Loader2, ArrowUp, ArrowDown } from "lucide-react";

export function AdminVotesTab() {
  const { voteFilters, setVoteSearch, toggleFiltersPanel, filtersPanelOpen } = useAdminStore();

  const {
    data: logsData,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: [
      "admin",
      "votes",
      voteFilters.search,
      voteFilters.voteType,
      voteFilters.source,
    ],
    queryFn: async () => {
      const query = new URLSearchParams();
      if (voteFilters.search) query.set("search", voteFilters.search);
      if (voteFilters.voteType !== "ALL") query.set("voteType", voteFilters.voteType);
      if (voteFilters.source !== "ALL") query.set("source", voteFilters.source);
      query.set("limit", "100");

      const res = await fetch(`/api/v1/admin/votes?${query.toString()}`);
      if (!res.ok) throw new Error("Failed to load vote ledger");
      const json = await res.json();
      return (json.logs ?? []) as VoteLogItem[];
    },
  });

  const logs = logsData ?? [];

  return (
    <div className="space-y-4">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <Input
            type="text"
            value={voteFilters.search}
            onChange={(e) => setVoteSearch(e.target.value)}
            placeholder="Search by user email or country…"
            className="pl-8 h-8 text-xs bg-zinc-900 border-zinc-800 text-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
            className="border-zinc-800 text-zinc-400 hover:text-white text-xs h-8"
          >
            <RefreshCw className={`size-3.5 ${isRefetching ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>

          <Button
            variant={filtersPanelOpen ? "secondary" : "outline"}
            size="sm"
            onClick={toggleFiltersPanel}
            className="border-zinc-800 text-xs h-8 gap-1.5"
          >
            <Filter className="size-3.5" />
            <span>Filters</span>
          </Button>
        </div>
      </div>

      {/* Vote Log Table */}
      <div className="rounded-xl border border-zinc-800/80 bg-[#0B0B0D] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="border-b border-zinc-800 bg-zinc-900/40 text-zinc-400 font-mono uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Country</th>
                <th className="py-3 px-4">Direction</th>
                <th className="py-3 px-4">Quota Source</th>
                <th className="py-3 px-4 text-right">Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500">
                    <Loader2 className="size-5 animate-spin mx-auto mb-2 text-zinc-400" />
                    Loading voting ledger…
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-zinc-500">
                    No vote logs recorded.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-900/30 transition-colors">
                    <td className="py-3 px-4 font-mono text-zinc-500 text-[11px]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-white">{log.userName || "Anonymous"}</div>
                      <div className="text-[11px] text-zinc-400 font-mono">{log.userEmail}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <CountryFlag code={log.countryCode} size="xs" className="rounded-[2px]" />
                        <span className="font-medium text-white">{log.countryName}</span>
                        <span className="text-[10px] font-mono text-zinc-400 uppercase">
                          ({log.countryCode})
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {log.voteType === "UPVOTE" ? (
                        <span className="inline-flex items-center gap-1 font-mono text-emerald-400 bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-500/20 text-[11px]">
                          <ArrowUp className="size-3" /> UPVOTE
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-mono text-red-400 bg-red-950/30 px-2 py-0.5 rounded border border-red-500/20 text-[11px]">
                          <ArrowDown className="size-3" /> DOWNVOTE
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-mono text-[10px] px-2 py-0.5 rounded border uppercase ${
                          log.voteIntentionType === "FREE"
                            ? "bg-zinc-800/40 border-zinc-700 text-zinc-300"
                            : "bg-amber-950/30 border-amber-500/30 text-amber-300"
                        }`}
                      >
                        {log.voteIntentionType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-white font-medium">
                      +{log.count}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
