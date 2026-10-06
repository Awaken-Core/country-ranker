"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAdminStore } from "@/stores/use-admin-store";
import { AdminUserDTO } from "@/modules/admin/admin.types";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminFiltersPanel } from "@/components/admin/admin-filters-panel";
import { AdminCountriesTab } from "@/components/admin/tabs/admin-countries-tab";
import { AdminVotesTab } from "@/components/admin/tabs/admin-votes-tab";
import { AdminUsersTab } from "@/components/admin/tabs/admin-users-tab";
import { AdminManagementTab } from "@/components/admin/tabs/admin-management-tab";
import { AdminAuditLogsTab } from "@/components/admin/tabs/admin-audit-logs-tab";
import { Loader2, ShieldX } from "lucide-react";
import {Link} from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export default function AdminDashboardPage() {
  const { activeTab } = useAdminStore();

  const {
    data: adminUser,
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: ["admin", "me"],
    queryFn: async () => {
      const res = await fetch("/api/v1/admin/me");
      if (res.status === 401) {
        throw new Error("You must sign in with an administrator account.");
      }
      if (res.status === 403) {
        throw new Error("Access Denied: You do not have administrator privileges.");
      }
      if (!res.ok) {
        throw new Error("Failed to verify administrator privileges.");
      }
      return (await res.json()) as AdminUserDTO;
    },
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#09090B] text-zinc-400 font-sans">
        <Loader2 className="size-6 animate-spin text-purple-400 mb-3" />
        <p className="text-xs font-mono uppercase tracking-wider">Verifying Admin Credentials…</p>
      </div>
    );
  }

  if (queryError || !adminUser) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#09090B] text-zinc-300 font-sans p-4">
        <div className="max-w-md w-full p-6 rounded-2xl border border-red-500/20 bg-red-950/10 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
            <ShieldX className="size-6" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-white">Administrator Access Required</h1>
            <p className="text-xs text-zinc-400 mt-1">{queryError?.message || "Unauthorized"}</p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <Button asChild size="sm" variant="outline" className="border-zinc-800 text-xs">
              <Link href="/">Return to Public Site</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-[#070709] text-white font-sans">
      {/* Collapsible Admin Sidebar */}
      <AdminSidebar userRole={adminUser.role} userPermissions={adminUser.permissions} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header Bar */}
        <header className="h-14 border-b border-zinc-800 bg-[#09090B] shrink-0 flex items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold capitalize tracking-tight">
              {activeTab === "countries" && "Country Directory & Adjustments"}
              {activeTab === "votes" && "Voting Ledger & Ingestion Stream"}
              {activeTab === "users" && "User Accounts & RBAC Roles"}
              {activeTab === "admins" && "Super Admin & Staff Management"}
              {activeTab === "audit-logs" && "System Audit Log Trail"}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-zinc-400 font-mono">{adminUser.email}</span>
              <span
                className={`font-mono text-[9px] px-2 py-0.5 rounded border uppercase font-semibold ${
                  adminUser.role === "SUPER_ADMIN"
                    ? "bg-purple-950/60 border-purple-500/40 text-purple-300"
                    : "bg-blue-950/60 border-blue-500/40 text-blue-300"
                }`}
              >
                {adminUser.role}
              </span>
            </div>
          </div>
        </header>

        {/* Tab Body */}
        <main className="flex-1 overflow-y-auto p-6">
          {activeTab === "countries" && (
            <AdminCountriesTab userRole={adminUser.role} userPermissions={adminUser.permissions} />
          )}
          {activeTab === "votes" && <AdminVotesTab />}
          {activeTab === "users" && <AdminUsersTab currentUserRole={adminUser.role} />}
          {activeTab === "admins" && <AdminManagementTab />}
          {activeTab === "audit-logs" && <AdminAuditLogsTab />}
        </main>
      </div>

      {/* Slide-out Filters Panel */}
      <AdminFiltersPanel />
    </div>
  );
}
