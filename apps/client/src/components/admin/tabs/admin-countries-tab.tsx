"use client";

import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAdminStore } from "@/stores/use-admin-store";
import { AdminCountryItem, UserRole, AdminPermission } from "@/modules/admin/admin.types";
import { CountryFlag } from "@/components/country-flag";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  SlidersHorizontal,
  Edit2,
  Filter,
  Loader2,
  Search,
  RefreshCw,
} from "lucide-react";
import { AdjustmentModal } from "../adjustment-modal";
import { EditCountryModal } from "../edit-country-modal";

interface AdminCountriesTabProps {
  userRole: UserRole;
  userPermissions: AdminPermission[];
}

export function AdminCountriesTab({ userRole, userPermissions }: AdminCountriesTabProps) {
  const {
    openAdjustmentModal,
    openEditCountryModal,
    countryFilters,
    setCountrySearch,
    toggleFiltersPanel,
    filtersPanelOpen,
  } = useAdminStore();

  const canEdit = userRole === "SUPER_ADMIN" || userPermissions.includes("COUNTRIES_EDIT");
  const canAdjust = userRole === "SUPER_ADMIN" || userPermissions.includes("VOTES_ADJUST");

  const {
    data: countriesData,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["admin", "countries", countryFilters.search],
    queryFn: async () => {
      const query = new URLSearchParams();
      if (countryFilters.search) query.set("search", countryFilters.search);
      query.set("limit", "250");
      const res = await fetch(`/api/v1/countries?${query.toString()}`);
      if (!res.ok) throw new Error("Failed to load countries");
      const json = await res.json();
      return (json.data ?? []) as AdminCountryItem[];
    },
  });

  const sortedCountries = useMemo(() => {
    if (!countriesData) return [];
    const list = [...countriesData];
    if (countryFilters.sortBy === "name") {
      list.sort((a, b) =>
        countryFilters.sortOrder === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name)
      );
    } else if (countryFilters.sortBy === "upvotes") {
      list.sort((a, b) =>
        countryFilters.sortOrder === "asc"
          ? a.totalUpvotes - b.totalUpvotes
          : b.totalUpvotes - a.totalUpvotes
      );
    } else if (countryFilters.sortBy === "downvotes") {
      list.sort((a, b) =>
        countryFilters.sortOrder === "asc"
          ? a.totalDownvotes - b.totalDownvotes
          : b.totalDownvotes - a.totalDownvotes
      );
    }
    return list;
  }, [countriesData, countryFilters.sortBy, countryFilters.sortOrder]);

  return (
    <div className="space-y-4">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <Input
            type="text"
            value={countryFilters.search}
            onChange={(e) => setCountrySearch(e.target.value)}
            placeholder="Search countries by name or code…"
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

      {/* Countries Table */}
      <div className="rounded-xl border border-zinc-800/80 bg-[#0B0B0D] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="border-b border-zinc-800 bg-zinc-900/40 text-zinc-400 font-mono uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Country</th>
                <th className="py-3 px-4">ISO Code</th>
                <th className="py-3 px-4 text-right">Upvotes</th>
                <th className="py-3 px-4 text-right">Downvotes</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-zinc-500">
                    <Loader2 className="size-5 animate-spin mx-auto mb-2 text-zinc-400" />
                    Loading countries catalog…
                  </td>
                </tr>
              ) : sortedCountries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-zinc-500">
                    No countries found matching query.
                  </td>
                </tr>
              ) : (
                sortedCountries.map((country) => (
                  <tr key={country.id} className="hover:bg-zinc-900/30 transition-colors">
                    <td className="py-3 px-4 font-medium text-white flex items-center gap-2.5">
                      <CountryFlag code={country.code} size="sm" className="rounded-[2px]" />
                      <span>{country.name}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-zinc-400 uppercase">{country.code}</td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-400 font-medium">
                      {country.totalUpvotes.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-red-400 font-medium">
                      {country.totalDownvotes.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5">
                      {canAdjust && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openAdjustmentModal(country)}
                          className="h-7 text-[11px] border-zinc-800 text-blue-400 hover:text-blue-300 hover:bg-blue-950/20"
                          title="Adjust Votes"
                        >
                          <SlidersHorizontal className="size-3 mr-1" /> Adjust
                        </Button>
                      )}
                      {canEdit && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditCountryModal(country)}
                          className="h-7 text-[11px] border-zinc-800 text-zinc-300 hover:text-white"
                          title="Edit Details"
                        >
                          <Edit2 className="size-3 mr-1" /> Edit
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AdjustmentModal />
      <EditCountryModal />
    </div>
  );
}
