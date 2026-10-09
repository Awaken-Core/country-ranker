"use client";

import React from "react";
import { useAdminStore } from "@/stores/use-admin-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X, Filter, RotateCcw } from "lucide-react";

export function AdminFiltersPanel() {
  const {
    filtersPanelOpen,
    setFiltersPanelOpen,
    activeTab,
    countryFilters,
    setCountrySearch,
    setCountrySort,
    voteFilters,
    setVoteSearch,
    setVoteFilterType,
    setVoteFilterSource,
  } = useAdminStore();

  if (!filtersPanelOpen) return null;

  return (
    <div className="fixed inset-x-0 top-14 bottom-16 z-50 flex w-auto flex-col justify-between border-y border-zinc-800 bg-[#0C0C0E] p-4 md:relative md:inset-auto md:z-auto md:w-72 md:shrink-0 md:border-y-0 md:border-l">
      <div className="space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-blue-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white">Filters</h3>
          </div>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setFiltersPanelOpen(false)}
            className="text-zinc-500 hover:text-white"
          >
            <X className="size-3.5" />
          </Button>
        </div>

        {activeTab === "countries" && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] text-zinc-400 uppercase font-mono">Search Country</Label>
              <Input
                type="text"
                value={countryFilters.search}
                onChange={(e) => setCountrySearch(e.target.value)}
                placeholder="Name, code or slug…"
                className="h-8 bg-zinc-900 border-zinc-800 text-xs text-white"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] text-zinc-400 uppercase font-mono">Sort By</Label>
              <select
                value={`${countryFilters.sortBy}-${countryFilters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split("-") as [any, any];
                  setCountrySort(sortBy, sortOrder);
                }}
                className="w-full h-8 px-2.5 rounded-md bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 outline-none"
              >
                <option value="upvotes-desc">Highest Upvotes</option>
                <option value="upvotes-asc">Lowest Upvotes</option>
                <option value="downvotes-desc">Highest Downvotes</option>
                <option value="downvotes-asc">Lowest Downvotes</option>
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
              </select>
            </div>
          </div>
        )}

        {activeTab === "votes" && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] text-zinc-400 uppercase font-mono">Search Votes</Label>
              <Input
                type="text"
                value={voteFilters.search}
                onChange={(e) => setVoteSearch(e.target.value)}
                placeholder="User email, country…"
                className="h-8 bg-zinc-900 border-zinc-800 text-xs text-white"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] text-zinc-400 uppercase font-mono">Vote Direction</Label>
              <select
                value={voteFilters.voteType}
                onChange={(e) => setVoteFilterType(e.target.value as any)}
                className="w-full h-8 px-2.5 rounded-md bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 outline-none"
              >
                <option value="ALL">All Directions</option>
                <option value="UPVOTE">Upvotes Only</option>
                <option value="DOWNVOTE">Downvotes Only</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] text-zinc-400 uppercase font-mono">Vote Quota Source</Label>
              <select
                value={voteFilters.source}
                onChange={(e) => setVoteFilterSource(e.target.value as any)}
                className="w-full h-8 px-2.5 rounded-md bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 outline-none"
              >
                <option value="ALL">All Sources</option>
                <option value="FREE">Daily Free Votes</option>
                <option value="PURCHASED">Purchased Credits</option>
              </select>
            </div>
          </div>
        )}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setCountrySearch("");
          setCountrySort("upvotes", "desc");
          setVoteSearch("");
          setVoteFilterType("ALL");
          setVoteFilterSource("ALL");
        }}
        className="w-full text-xs text-zinc-400 hover:text-white border-zinc-800 gap-1.5 mt-4"
      >
        <RotateCcw className="size-3" /> Reset Filters
      </Button>
    </div>
  );
}
