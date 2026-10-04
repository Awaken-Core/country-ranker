"use client";

import React from "react";
import Link from "next/link";
import { useAdminStore, AdminTab } from "@/stores/use-admin-store";
import { UserRole, AdminPermission } from "@/modules/admin/admin.types";
import {
  Globe,
  Vote,
  Users,
  ShieldAlert,
  History,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminSidebarProps {
  userRole: UserRole;
  userPermissions: AdminPermission[];
}

export function AdminSidebar({ userRole, userPermissions }: AdminSidebarProps) {
  const { activeTab, setActiveTab, sidebarCollapsed, toggleSidebar } = useAdminStore();
  const isSuperAdmin = userRole === "SUPER_ADMIN";

  const hasPerm = (perm: AdminPermission) => isSuperAdmin || userPermissions.includes(perm);

  const navItems: {
    id: AdminTab;
    label: string;
    icon: React.ReactNode;
    visible: boolean;
    badge?: string;
  }[] = [
    {
      id: "countries",
      label: "Countries",
      icon: <Globe className="size-4 shrink-0" />,
      visible: hasPerm("COUNTRIES_VIEW"),
    },
    {
      id: "votes",
      label: "Votes & Ledger",
      icon: <Vote className="size-4 shrink-0" />,
      visible: hasPerm("VOTES_VIEW"),
    },
    {
      id: "users",
      label: "Users Directory",
      icon: <Users className="size-4 shrink-0" />,
      visible: hasPerm("USERS_VIEW"),
    },
    {
      id: "admins",
      label: "Admin Management",
      icon: <ShieldAlert className="size-4 shrink-0" />,
      visible: isSuperAdmin,
      badge: "Super Admin",
    },
    {
      id: "audit-logs",
      label: "Audit Logs",
      icon: <History className="size-4 shrink-0" />,
      visible: hasPerm("AUDIT_LOGS_VIEW"),
    },
  ];

  return (
    <aside
      className={`h-screen border-r border-zinc-800 bg-[#09090B] flex flex-col justify-between transition-all duration-200 z-30 select-none ${
        sidebarCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Top Header / Branding */}
      <div>
        <div className="h-14 border-b border-zinc-800 flex items-center justify-between px-3.5">
          {!sidebarCollapsed ? (
            <Link href="/admin" className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                <Sparkles className="size-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold tracking-tight text-white leading-none">
                  Admin Console
                </span>
                <span className="text-[10px] font-mono text-zinc-400 leading-none mt-1">
                  {isSuperAdmin ? "SUPER ADMIN" : "STAFF ADMIN"}
                </span>
              </div>
            </Link>
          ) : (
            <div className="w-7 h-7 mx-auto rounded-md bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center justify-center">
              <Sparkles className="size-4" />
            </div>
          )}

          <Button
            variant="ghost"
            size="icon-xs"
            onClick={toggleSidebar}
            className="text-zinc-500 hover:text-white"
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          </Button>
        </div>

        {/* Navigation list */}
        <nav className="p-2 space-y-1 mt-2">
          {navItems
            .filter((item) => item.visible)
            .map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? "bg-purple-600/15 text-purple-300 border border-purple-500/30 shadow-[0_0_12px_rgba(168,85,247,0.15)]"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800/40 border border-transparent"
                  } ${sidebarCollapsed ? "justify-center px-0" : ""}`}
                >
                  {item.icon}
                  {!sidebarCollapsed && (
                    <div className="flex-1 flex items-center justify-between">
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="text-[9px] font-mono uppercase bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
        </nav>
      </div>

      {/* Footer Return Link */}
      <div className="p-3 border-t border-zinc-800/80">
        <Link
          href="/"
          className={`flex items-center gap-2.5 py-2 px-2.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors ${
            sidebarCollapsed ? "justify-center px-0" : ""
          }`}
          title="Return to Public Site"
        >
          <LogOut className="size-4 rotate-180 shrink-0 text-zinc-500" />
          {!sidebarCollapsed && <span>Return to Site</span>}
        </Link>
      </div>
    </aside>
  );
}
