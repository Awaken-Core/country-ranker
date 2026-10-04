"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminUserDTO, UserRole } from "@/modules/admin/admin.types";
import { useAdminStore } from "@/stores/use-admin-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, RefreshCw, Loader2, ShieldCheck, ShieldAlert, KeyRound, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { PermissionsModal } from "../permissions-modal";

interface AdminUsersTabProps {
  currentUserRole: UserRole;
}

export function AdminUsersTab({ currentUserRole }: AdminUsersTabProps) {
  const queryClient = useQueryClient();
  const { userSearch, setUserSearch, openPermissionsModal } = useAdminStore();
  const [selectedUserForPerms, setSelectedUserForPerms] = useState<AdminUserDTO | null>(null);

  const isSuperAdmin = currentUserRole === "SUPER_ADMIN";

  const {
    data: usersData,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["admin", "users", userSearch],
    queryFn: async () => {
      const query = new URLSearchParams();
      if (userSearch) query.set("search", userSearch);
      query.set("limit", "100");
      const res = await fetch(`/api/v1/admin/users?${query.toString()}`);
      if (!res.ok) throw new Error("Failed to load users");
      const json = await res.json();
      return (json.users ?? []) as AdminUserDTO[];
    },
  });

  const demoteAdminMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch("/api/v1/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REMOVE_ADMIN",
          targetUserId: userId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove admin");
      return data;
    },
    onSuccess: () => {
      toast.success("Admin role removed");
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "admins"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to demote admin");
    },
  });

  const promoteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch("/api/v1/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_ADMIN",
          targetUserId: userId,
          permissions: ["COUNTRIES_VIEW", "COUNTRIES_EDIT", "VOTES_VIEW", "VOTES_ADJUST"],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to promote user");
      return data;
    },
    onSuccess: () => {
      toast.success("User promoted to Admin");
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "admins"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to promote user");
    },
  });

  const users = usersData ?? [];

  return (
    <div className="space-y-4">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <Input
            type="text"
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            placeholder="Search by name or email…"
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

      {/* Users Table */}
      <div className="rounded-xl border border-zinc-800/80 bg-[#0B0B0D] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="border-b border-zinc-800 bg-zinc-900/40 text-zinc-400 font-mono uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Permissions</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-zinc-500">
                    <Loader2 className="size-5 animate-spin mx-auto mb-2 text-zinc-400" />
                    Loading users directory…
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-zinc-500">
                    No users found matching query.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-zinc-900/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-white">{user.name || "Nameless Voter"}</div>
                      <div className="text-[11px] text-zinc-400 font-mono">{user.email}</div>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {user.role === "SUPER_ADMIN" ? (
                        <span className="inline-flex items-center gap-1 text-purple-400 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-500/30 text-[10px]">
                          <ShieldAlert className="size-3" /> SUPER ADMIN
                        </span>
                      ) : user.role === "ADMIN" ? (
                        <span className="inline-flex items-center gap-1 text-blue-400 bg-blue-950/40 px-2 py-0.5 rounded border border-blue-500/30 text-[10px]">
                          <ShieldCheck className="size-3" /> ADMIN
                        </span>
                      ) : (
                        <span className="text-zinc-500 text-[11px]">USER</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px]">
                      {user.emailVerified ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <UserCheck className="size-3" /> Verified
                        </span>
                      ) : (
                        <span className="text-zinc-500">Unverified</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {user.role === "SUPER_ADMIN" ? (
                        <span className="text-[11px] text-purple-300 font-mono italic">
                          All Permissions Granted
                        </span>
                      ) : user.permissions.length > 0 ? (
                        <span className="text-[11px] text-zinc-300 font-mono">
                          {user.permissions.length} active permissions
                        </span>
                      ) : (
                        <span className="text-[11px] text-zinc-600 font-mono">Standard permissions</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5">
                      {isSuperAdmin && user.role === "ADMIN" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedUserForPerms(user);
                              openPermissionsModal(user.id);
                            }}
                            className="h-7 text-[11px] border-zinc-800 text-purple-400 hover:text-purple-300"
                          >
                            <KeyRound className="size-3 mr-1" /> Permissions
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={demoteAdminMutation.isPending}
                            onClick={() => {
                              if (confirm(`Revoke Admin access from ${user.name || user.email}?`)) {
                                demoteAdminMutation.mutate(user.id);
                              }
                            }}
                            className="h-7 text-[11px]"
                          >
                            Remove Admin
                          </Button>
                        </>
                      )}

                      {isSuperAdmin && user.role === "USER" && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={promoteUserMutation.isPending}
                          onClick={() => promoteUserMutation.mutate(user.id)}
                          className="h-7 text-[11px] border-zinc-800 text-emerald-400 hover:text-emerald-300"
                        >
                          Make Admin
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

      {selectedUserForPerms && (
        <PermissionsModal
          currentPermissions={selectedUserForPerms.permissions}
          targetUserName={selectedUserForPerms.name || selectedUserForPerms.email}
          onSuccess={() => {
            void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
          }}
        />
      )}
    </div>
  );
}
