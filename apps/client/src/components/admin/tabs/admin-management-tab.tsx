"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminUserDTO } from "@/modules/admin/admin.types";
import { useAdminStore } from "@/stores/use-admin-store";
import { Button } from "@/components/ui/button";
import { UserPlus, ShieldCheck, KeyRound, Trash2, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CreateAdminModal } from "../create-admin-modal";
import { PermissionsModal } from "../permissions-modal";

export function AdminManagementTab() {
  const queryClient = useQueryClient();
  const { openCreateAdminModal, openPermissionsModal } = useAdminStore();
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUserDTO | null>(null);

  const {
    data: adminsData,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["admin", "admins"],
    queryFn: async () => {
      const res = await fetch("/api/v1/admin/users?role=ADMIN");
      if (!res.ok) throw new Error("Failed to load administrators");
      const json = await res.json();
      return (json.users ?? []) as AdminUserDTO[];
    },
  });

  const removeAdminMutation = useMutation({
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
      toast.success("Admin privileges removed");
      void queryClient.invalidateQueries({ queryKey: ["admin", "admins"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to remove admin");
    },
  });

  const admins = adminsData ?? [];

  return (
    <div className="space-y-4">
      {/* Top action bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">Staff Administrators</h2>
          <p className="text-xs text-zinc-400">
            Super Admin console to grant, modify, and revoke admin staff privileges.
          </p>
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
            size="sm"
            onClick={openCreateAdminModal}
            className="bg-purple-600 hover:bg-purple-500 text-white text-xs h-8 gap-1.5"
          >
            <UserPlus className="size-3.5" />
            <span>Create Admin</span>
          </Button>
        </div>
      </div>

      {/* Admin Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full py-16 text-center text-zinc-500">
            <Loader2 className="size-5 animate-spin mx-auto mb-2 text-zinc-400" />
            Loading administrators list…
          </div>
        ) : admins.length === 0 ? (
          <div className="col-span-full py-12 text-center text-zinc-500 rounded-xl border border-zinc-800/80 bg-[#0B0B0D]">
            No staff administrators configured yet. Click &quot;Create Admin&quot; above to promote a user.
          </div>
        ) : (
          admins.map((admin) => (
            <div
              key={admin.id}
              className="p-4 rounded-xl border border-zinc-800 bg-[#0C0C0E] hover:border-zinc-700 transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white">{admin.name || "Nameless Admin"}</h3>
                    <p className="text-xs text-zinc-400 font-mono mt-0.5">{admin.email}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-blue-400 bg-blue-950/40 px-2 py-0.5 rounded border border-blue-500/30 text-[10px] font-mono">
                    <ShieldCheck className="size-3" /> ADMIN
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-800/80">
                  <p className="text-[10px] font-mono uppercase text-zinc-500 tracking-wider mb-2">
                    Granted Permissions ({admin.permissions.length})
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {admin.permissions.map((perm) => (
                      <span
                        key={perm}
                        className="text-[10px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded"
                      >
                        {perm}
                      </span>
                    ))}
                    {admin.permissions.length === 0 && (
                      <span className="text-[11px] text-zinc-600 italic">No permissions assigned</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-2 flex items-center justify-between border-t border-zinc-800/60">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedAdmin(admin);
                    openPermissionsModal(admin.id);
                  }}
                  className="h-7 text-xs border-zinc-800 text-purple-400 hover:text-purple-300"
                >
                  <KeyRound className="size-3 mr-1.5" /> Permissions
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  disabled={removeAdminMutation.isPending}
                  onClick={() => {
                    if (confirm(`Are you sure you want to remove Admin privileges from ${admin.name || admin.email}?`)) {
                      removeAdminMutation.mutate(admin.id);
                    }
                  }}
                  className="h-7 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/20"
                >
                  <Trash2 className="size-3 mr-1.5" /> Remove
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <CreateAdminModal
        onSuccess={() => {
          void queryClient.invalidateQueries({ queryKey: ["admin", "admins"] });
          void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
        }}
      />
      {selectedAdmin && (
        <PermissionsModal
          currentPermissions={selectedAdmin.permissions}
          targetUserName={selectedAdmin.name || selectedAdmin.email}
          onSuccess={() => {
            void queryClient.invalidateQueries({ queryKey: ["admin", "admins"] });
            void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
          }}
        />
      )}
    </div>
  );
}
