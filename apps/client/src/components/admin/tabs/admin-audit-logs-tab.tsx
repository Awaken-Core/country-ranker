"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { AuditLogDTO } from "@/modules/admin/admin.types";
import { useAdminStore } from "@/stores/use-admin-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, RefreshCw, Loader2, History } from "lucide-react";

export function AdminAuditLogsTab() {
  const { auditSearch, setAuditSearch } = useAdminStore();

  const {
    data: logsData,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["admin", "audit-logs", auditSearch],
    queryFn: async () => {
      const query = new URLSearchParams();
      if (auditSearch) query.set("search", auditSearch);
      query.set("limit", "100");

      const res = await fetch(`/api/v1/admin/audit-logs?${query.toString()}`);
      if (!res.ok) throw new Error("Failed to load audit logs");
      const json = await res.json();
      return (json.logs ?? []) as AuditLogDTO[];
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
            value={auditSearch}
            onChange={(e) => setAuditSearch(e.target.value)}
            placeholder="Search by action, user or target…"
            className="pl-8 h-8 text-xs bg-zinc-900 border-zinc-800 text-white"
          />
        </div>

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
      </div>

      {/* Audit Log Table */}
      <div className="rounded-xl border border-zinc-800/80 bg-[#0B0B0D] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[720px] w-full text-left text-xs font-sans">
            <thead className="border-b border-zinc-800 bg-zinc-900/40 text-zinc-400 font-mono uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target</th>
                <th className="py-3 px-4">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-zinc-500">
                    <Loader2 className="size-5 animate-spin mx-auto mb-2 text-zinc-400" />
                    Loading audit trail…
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-zinc-500">
                    <History className="size-5 mx-auto mb-1 text-zinc-600" />
                    No audit records logged yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-900/30 transition-colors">
                    <td className="py-3 px-4 font-mono text-zinc-500 text-[11px] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-white">{log.user.name || "Admin"}</div>
                      <div className="text-[11px] text-zinc-400 font-mono">{log.user.email}</div>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span className="bg-zinc-800/80 border border-zinc-700/80 text-purple-300 px-2 py-0.5 rounded text-[11px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-zinc-300 text-[11px]">
                      <span className="text-zinc-500 uppercase mr-1">{log.targetType}:</span>
                      <span>{log.targetId || "Global"}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-zinc-300 max-w-md">
                      {log.action === "ADJUST_VOTES" && log.details ? (
                        <div className="space-y-0.5 text-[10px]">
                          <div className="text-zinc-400">
                            Upvotes: {String((log.details as any).previousUpvotes)} →{" "}
                            <span className="text-emerald-400 font-bold">
                              {String((log.details as any).newUpvotes)}
                            </span>{" "}
                            (delta: {(log.details as any).upvotesDelta})
                          </div>
                          <div className="text-zinc-400">
                            Downvotes: {String((log.details as any).previousDownvotes)} →{" "}
                            <span className="text-red-400 font-bold">
                              {String((log.details as any).newDownvotes)}
                            </span>{" "}
                            (delta: {(log.details as any).downvotesDelta})
                          </div>
                          <div className="text-purple-300 italic">
                            Reason: &quot;{(log.details as any).reason}&quot;
                          </div>
                        </div>
                      ) : log.details ? (
                        <span className="truncate block">{JSON.stringify(log.details)}</span>
                      ) : (
                        "—"
                      )}
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
