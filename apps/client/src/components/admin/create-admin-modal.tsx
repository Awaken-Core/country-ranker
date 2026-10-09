"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAdminStore } from "@/stores/use-admin-store";
import { AdminPermission } from "@/modules/admin/admin.types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";

const DEFAULT_ADMIN_PERMISSIONS: { key: AdminPermission; label: string }[] = [
  { key: "ADS_MANAGE", label: "Manage Advertisements" },
  { key: "COUNTRIES_VIEW", label: "View Countries" },
  { key: "COUNTRIES_EDIT", label: "Edit Countries" },
  { key: "VOTES_VIEW", label: "View Votes" },
  { key: "VOTES_ADJUST", label: "Adjust Votes" },
  { key: "USERS_VIEW", label: "View Users" },
  { key: "USERS_MANAGE", label: "Manage Users" },
  { key: "AUDIT_LOGS_VIEW", label: "View Audit Logs" },
];

interface CreateAdminModalProps {
  onSuccess?: () => void;
}

export function CreateAdminModal({ onSuccess }: CreateAdminModalProps) {
  const queryClient = useQueryClient();
  const { createAdminModalOpen, closeCreateAdminModal } = useAdminStore();
  const [targetUserId, setTargetUserId] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<AdminPermission[]>([
    "COUNTRIES_VIEW",
    "COUNTRIES_EDIT",
    "VOTES_VIEW",
    "VOTES_ADJUST",
    "USERS_VIEW",
    "AUDIT_LOGS_VIEW",
  ]);

  const createAdminMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/v1/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_ADMIN",
          targetUserId: targetUserId.trim(),
          permissions: selectedPermissions,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to promote user to Admin");
      return data;
    },
    onSuccess: () => {
      toast.success("Admin created successfully");
      setTargetUserId("");
      closeCreateAdminModal();
      void queryClient.invalidateQueries({ queryKey: ["admin", "admins"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "audit-logs"] });
      onSuccess?.();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create admin");
    },
  });

  const togglePermission = (perm: AdminPermission) => {
    setSelectedPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserId.trim()) {
      toast.error("Please enter a User ID");
      return;
    }
    createAdminMutation.mutate();
  };

  return (
    <Dialog open={createAdminModalOpen} onOpenChange={(open) => !open && closeCreateAdminModal()}>
      <DialogContent className="max-w-md bg-[#0F0F11] border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold flex items-center gap-2">
            <UserPlus className="size-4 text-emerald-400" />
            <span>Create New Admin</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleCreate} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-300">Target User ID</Label>
            <Input
              type="text"
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
              placeholder="e.g. usr_123 or UUID"
              className="bg-zinc-900 border-zinc-800 text-white text-xs font-mono"
              required
            />
            <p className="text-[11px] text-zinc-500">
              User must already have an account created on the platform.
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-zinc-300">Initial Permissions</Label>
            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
              {DEFAULT_ADMIN_PERMISSIONS.map((p) => {
                const isChecked = selectedPermissions.includes(p.key);
                return (
                  <label
                    key={p.key}
                    className="flex items-center gap-2.5 text-xs text-zinc-300 cursor-pointer p-1.5 rounded hover:bg-zinc-900/60"
                  >
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => togglePermission(p.key)}
                    />
                    <span>{p.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={closeCreateAdminModal}
              disabled={createAdminMutation.isPending}
              className="border-zinc-800 text-zinc-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={createAdminMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              {createAdminMutation.isPending ? <Loader2 className="size-3.5 animate-spin" /> : "Promote to Admin"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
