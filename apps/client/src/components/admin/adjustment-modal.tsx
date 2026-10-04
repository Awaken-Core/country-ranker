"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAdminStore } from "@/stores/use-admin-store";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowUp, ArrowDown } from "lucide-react";
import { CountryFlag } from "@/components/country-flag";
import { toast } from "sonner";

interface AdjustmentModalProps {
  onSuccess?: () => void;
}

export function AdjustmentModal({ onSuccess }: AdjustmentModalProps) {
  const queryClient = useQueryClient();
  const { adjustmentModalOpen, closeAdjustmentModal, selectedCountry } = useAdminStore();
  const [upvotesDelta, setUpvotesDelta] = useState<number>(0);
  const [downvotesDelta, setDownvotesDelta] = useState<number>(0);
  const [reason, setReason] = useState<string>("");

  const adjustMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCountry) throw new Error("No country selected");
      const res = await fetch("/api/v1/admin/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          countryId: selectedCountry.id,
          upvotesDelta,
          downvotesDelta,
          reason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to adjust votes");
      }
      return data;
    },
    onSuccess: () => {
      toast.success(`Votes adjusted for ${selectedCountry?.name}`);
      setUpvotesDelta(0);
      setDownvotesDelta(0);
      setReason("");
      closeAdjustmentModal();
      void queryClient.invalidateQueries({ queryKey: ["admin", "countries"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "votes"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "audit-logs"] });
      onSuccess?.();
    },
    onError: (err: any) => {
      toast.error(err.message || "An error occurred");
    },
  });

  if (!selectedCountry) return null;

  const handleAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (upvotesDelta === 0 && downvotesDelta === 0) {
      toast.error("Please enter a non-zero adjustment for upvotes or downvotes");
      return;
    }
    if (!reason.trim() || reason.trim().length < 5) {
      toast.error("Reason is mandatory and must be at least 5 characters long");
      return;
    }

    adjustMutation.mutate();
  };

  return (
    <Dialog open={adjustmentModalOpen} onOpenChange={(open) => !open && closeAdjustmentModal()}>
      <DialogContent className="max-w-md bg-[#0F0F11] border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold flex items-center gap-2">
            <CountryFlag code={selectedCountry.code} size="sm" className="rounded-[2px]" />
            <span>Adjust Votes:</span>
            <span className="text-blue-400">{selectedCountry.name}</span>
            <span className="text-xs font-mono text-zinc-500 uppercase">({selectedCountry.code})</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleAdjust} className="space-y-4 py-2">
          {/* Current standings */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/80 font-mono text-xs">
            <div>
              <p className="text-zinc-500 text-[10px] uppercase">Current Upvotes</p>
              <p className="text-emerald-400 font-bold text-sm mt-0.5">{selectedCountry.totalUpvotes.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-zinc-500 text-[10px] uppercase">Current Downvotes</p>
              <p className="text-red-400 font-bold text-sm mt-0.5">{selectedCountry.totalDownvotes.toLocaleString()}</p>
            </div>
          </div>

          {/* Upvotes delta input */}
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-300 flex items-center gap-1.5">
              <ArrowUp className="size-3.5 text-emerald-400" /> Upvotes Delta (+ or -)
            </Label>
            <Input
              type="number"
              value={upvotesDelta === 0 ? "" : upvotesDelta}
              onChange={(e) => setUpvotesDelta(parseInt(e.target.value) || 0)}
              placeholder="e.g. +50 or -10"
              className="bg-zinc-900 border-zinc-800 text-white font-mono text-xs"
            />
          </div>

          {/* Downvotes delta input */}
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-300 flex items-center gap-1.5">
              <ArrowDown className="size-3.5 text-red-400" /> Downvotes Delta (+ or -)
            </Label>
            <Input
              type="number"
              value={downvotesDelta === 0 ? "" : downvotesDelta}
              onChange={(e) => setDownvotesDelta(parseInt(e.target.value) || 0)}
              placeholder="e.g. +10 or -5"
              className="bg-zinc-900 border-zinc-800 text-white font-mono text-xs"
            />
          </div>

          {/* Reason for audit log */}
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-300 flex items-center justify-between">
              <span>Adjustment Reason (Mandatory)</span>
              <span className="text-[10px] text-zinc-500 font-mono">Min 5 chars</span>
            </Label>
            <Input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Cleared bot spam attack"
              className="bg-zinc-900 border-zinc-800 text-white text-xs"
              required
              minLength={5}
            />
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={closeAdjustmentModal}
              disabled={adjustMutation.isPending}
              className="border-zinc-800 text-zinc-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={adjustMutation.isPending}
              className="bg-blue-600 hover:bg-blue-500 text-white font-medium"
            >
              {adjustMutation.isPending ? <Loader2 className="size-3.5 animate-spin" /> : "Apply Adjustment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
