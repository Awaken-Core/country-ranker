"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAdminStore } from "@/stores/use-admin-store";
import { AdminPermission } from "@/modules/admin/admin.types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const ALL_PERMISSIONS: { key: AdminPermission; label: string; desc: string }[] = [
  { key: "COUNTRIES_VIEW", label: "View Countries", desc: "Browse country catalog and stats" },
  { key: "COUNTRIES_EDIT", label: "Edit Countries", desc: "Modify names, codes, and flags" },
  { key: "VOTES_VIEW", label: "View Votes", desc: "Access real-time voting ledger and audit logs" },
  { key: "VOTES_ADJUST", label: "Adjust Votes", desc: "Manually increment or decrement country scores" },
  { key: "USERS_VIEW", label: "View Users", desc: "Inspect registered users and voting accounts" },
  { key: "USERS_MANAGE", label: "Manage Users", desc: "Promote/demote roles and manage bans" },
  { key: "AUDIT_LOGS_VIEW", label: "View Audit Logs", desc: "Review complete operational history" },
  { key: "MANAGE_ADMINS", label: "Manage Admins", desc: "Super admin permission to grant/revoke roles" },
];

interface PermissionsModalProps {
  currentPermissions: AdminPermission[];
  targetUserName?: string;
  onSuccess?: () => void;
}

export function PermissionsModal({ currentPermissions, targetUserName, onSuccess }: PermissionsModalProps) {
  const queryClient = useQueryClient();
  const { permissionsModalOpen, closePermissionsModal, selectedAdminUserId } = useAdminStore();
  const [selected, setSelected] = useState<AdminPermission[]>(currentPermissions);

  React.useEffect(() => {
    setSelected(currentPermissions);
  }, [currentPermissions]);

  const updatePermissionsMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/v1/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SET_PERMISSIONS",
          targetUserId: selectedAdminUserId,
          permissions: selected,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update permissions");
      return data;
    },
    onSuccess: () => {
      toast.success("Permissions updated successfully");
      closePermissionsModal();
      void queryClient.invalidateQueries({ queryKey: ["admin", "admins"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "audit-logs"] });
      onSuccess?.();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update permissions");
    },
  });

  if (!selectedAdminUserId) return null;

  const togglePermission = (perm: AdminPermission) => {
    setSelected((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  return (
    <Dialog open={permissionsModalOpen} onOpenChange={(open) => !open && closePermissionsModal()}>
      <DialogContent className="max-w-lg bg-[#0F0F11] border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold flex items-center gap-2">
            <ShieldCheck className="size-4 text-purple-400" />
            <span>Manage Permissions:</span>
            <span className="text-zinc-400 font-normal">{targetUserName || selectedAdminUserId}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-3 max-h-[60vh] overflow-y-auto">
          {ALL_PERMISSIONS.map((p) => {
            const isChecked = selected.includes(p.key);
            return (
              <div
                key={p.key}
                onClick={() => togglePermission(p.key)}
                className={`p-3 rounded-lg border transition-all cursor-pointer flex items-start gap-3 ${
                  isChecked
                    ? "bg-purple-950/20 border-purple-500/40 text-purple-200"
                    : "bg-zinc-900/40 border-zinc-800/80 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={() => togglePermission(p.key)}
                  className="mt-0.5"
                />
                <div className="space-y-0.5">
                  <Label className="text-xs font-semibold cursor-pointer text-white">
                    {p.label}
                  </Label>
                  <p className="text-[11px] text-zinc-400">{p.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter className="pt-2 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={closePermissionsModal}
            disabled={updatePermissionsMutation.isPending}
            className="border-zinc-800 text-zinc-400 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => updatePermissionsMutation.mutate()}
            disabled={updatePermissionsMutation.isPending}
            className="bg-purple-600 hover:bg-purple-500 text-white"
          >
            {updatePermissionsMutation.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              "Save Permissions"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
