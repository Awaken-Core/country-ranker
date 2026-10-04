"use client";

import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAdminStore } from "@/stores/use-admin-store";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { CountryFlag } from "@/components/country-flag";
import { toast } from "sonner";

interface EditCountryModalProps {
  onSuccess?: () => void;
}

export function EditCountryModal({ onSuccess }: EditCountryModalProps) {
  const queryClient = useQueryClient();
  const { editCountryModalOpen, closeEditCountryModal, selectedCountry } = useAdminStore();
  const [name, setName] = useState("");

  useEffect(() => {
    if (selectedCountry) {
      setName(selectedCountry.name);
    }
  }, [selectedCountry]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCountry) throw new Error("No country selected");
      const res = await fetch(`/api/v1/admin/countries/${selectedCountry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update country");
      }
      return data;
    },
    onSuccess: () => {
      toast.success("Country updated successfully");
      closeEditCountryModal();
      void queryClient.invalidateQueries({ queryKey: ["admin", "countries"] });
      onSuccess?.();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update");
    },
  });

  if (!selectedCountry) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Country name cannot be empty");
      return;
    }
    updateMutation.mutate();
  };

  return (
    <Dialog open={editCountryModalOpen} onOpenChange={(open) => !open && closeEditCountryModal()}>
      <DialogContent className="max-w-md bg-[#0F0F11] border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold flex items-center gap-2">
            <CountryFlag code={selectedCountry.code} size="sm" className="rounded-[2px]" />
            <span>Edit Country:</span>
            <span className="text-blue-400">{selectedCountry.name}</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-300">Country Name</Label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-zinc-900 border-zinc-800 text-white text-xs"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-300">ISO Alpha-2 Code</Label>
            <div className="flex items-center gap-2.5 p-2 rounded-md bg-zinc-900/60 border border-zinc-800">
              <CountryFlag code={selectedCountry.code} size="md" className="rounded-[2px]" />
              <span className="font-mono text-xs font-semibold text-zinc-200 uppercase">
                {selectedCountry.code}
              </span>
              <span className="text-[10px] text-zinc-500 font-mono ml-auto">
                ISO 3166-1 alpha-2 (Immutable)
              </span>
            </div>
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={closeEditCountryModal}
              disabled={updateMutation.isPending}
              className="border-zinc-800 text-zinc-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={updateMutation.isPending}
              className="bg-blue-600 hover:bg-blue-500 text-white"
            >
              {updateMutation.isPending ? <Loader2 className="size-3.5 animate-spin" /> : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
