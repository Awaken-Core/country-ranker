"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Megaphone, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AdminPermission, UserRole } from "@/modules/admin/admin.types";

type Advertisement = {
  id: string;
  name: string;
  description: string | null;
  logo: string;
  website: string;
  bgColor: string | null;
  textColor: string | null;
};

type Position = {
  position: number;
  slotId: string | null;
  isActive: boolean;
  sponsor: Advertisement | null;
  reservation: { name: string; email: string } | null;
};

type FormValue = {
  name: string;
  description: string;
  logo: string;
  website: string;
  bgColor: string;
  textColor: string;
  isActive: boolean;
};

async function errorFromResponse(response: Response) {
  const text = await response.text();
  if (!text) return `Request failed (${response.status}).`;
  try {
    const data = JSON.parse(text) as { error?: string };
    return data.error || `Request failed (${response.status}).`;
  } catch {
    return `Request failed (${response.status}).`;
  }
}

const emptyForm: FormValue = {
  name: "",
  description: "",
  logo: "",
  website: "",
  bgColor: "#171717",
  textColor: "#ffffff",
  isActive: true,
};

function formFor(position: Position | undefined): FormValue {
  if (!position?.sponsor) return emptyForm;
  return {
    name: position.sponsor.name,
    description: position.sponsor.description ?? "",
    logo: position.sponsor.logo,
    website: position.sponsor.website,
    bgColor: position.sponsor.bgColor ?? "#171717",
    textColor: position.sponsor.textColor ?? "#ffffff",
    isActive: position.isActive,
  };
}

export function AdminAdsTab({
  userRole,
  userPermissions,
}: {
  userRole: UserRole;
  userPermissions: AdminPermission[];
}) {
  const queryClient = useQueryClient();
  const canManage =
    userRole === "SUPER_ADMIN" || userPermissions.includes("ADS_MANAGE");
  const [selectedPosition, setSelectedPosition] = useState(1);
  const [draft, setDraft] = useState<FormValue>(emptyForm);
  const [draftPosition, setDraftPosition] = useState<number | null>(null);
  const [moveToPosition, setMoveToPosition] = useState("2");
  const [draggedPosition, setDraggedPosition] = useState<number | null>(null);
  const { data, isError, error, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ["admin", "ads"],
    queryFn: async () => {
      const response = await fetch("/api/v1/admin/ads");
      if (!response.ok)
        throw new Error("Unable to load advertisement positions.");
      return response.json() as Promise<{
        capacity: number;
        positions: Position[];
      }>;
    },
    enabled: canManage,
  });
  const current = data?.positions.find(
    (item) => item.position === selectedPosition,
  );
  const positionIsReserved = Boolean(current?.reservation);

  const form = draftPosition === selectedPosition ? draft : formFor(current);
  const updateForm = (next: FormValue) => {
    setDraftPosition(selectedPosition);
    setDraft(next);
  };
  const selectPosition = (position: number) => {
    const item = data?.positions.find((entry) => entry.position === position);
    setSelectedPosition(position);
    setDraftPosition(position);
    setDraft(formFor(item));
  };

  const save = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/v1/admin/ads", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ position: selectedPosition, ...form }),
      });
      if (!response.ok) throw new Error(await errorFromResponse(response));
    },
    onSuccess: () => {
      toast.success(`Advertisement saved in position ${selectedPosition}.`);
      void queryClient.invalidateQueries({ queryKey: ["admin", "ads"] });
    },
    onError: (error) => toast.error(error.message),
  });

  const move = useMutation({
    mutationFn: async ({ sourcePosition, targetPosition }: { sourcePosition: number; targetPosition: number }) => {
      const response = await fetch("/api/v1/admin/ads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourcePosition, targetPosition }),
      });
      if (!response.ok) throw new Error(await errorFromResponse(response));
      return targetPosition;
    },
    onSuccess: (targetPosition) => {
      setSelectedPosition(targetPosition);
      setDraftPosition(null);
      toast.success(`Advertisement moved to position ${targetPosition}.`);
      void queryClient.invalidateQueries({ queryKey: ["admin", "ads"] });
    },
    onError: (error) => toast.error(error.message),
  });

  const moveAdvertisement = (sourcePosition: number, targetPosition: number) => {
    if (sourcePosition === targetPosition || move.isPending) return;
    move.mutate({ sourcePosition, targetPosition });
  };

  if (!canManage)
    return (
      <p className="text-sm text-zinc-400">
        You do not have permission to manage advertisements.
      </p>
    );
  if (isLoading)
    return (
      <div className="flex items-center gap-2 text-sm text-zinc-400">
        <Loader2 className="size-4 animate-spin" /> Loading advertisements…
      </div>
    );
  if (isError)
    return (
      <div className="rounded-lg border border-red-900/70 bg-red-950/30 p-4 text-sm text-red-200">
        <p className="font-medium">Unable to load advertisement positions.</p>
        <p className="mt-1 text-red-300/80">{error.message}</p>
        <Button className="mt-3" size="sm" variant="outline" onClick={() => void refetch()}>
          Try again
        </Button>
      </div>
    );

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
      <section className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">
              20 advertisement positions
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              Drag an occupied card onto any position to move it, or select a position below.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
            disabled={isRefetching}
          >
            <RefreshCw
              className={`mr-2 size-3.5 ${isRefetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          {data?.positions.map((item) => {
            const selected = item.position === selectedPosition;
            return (
              <button
                key={item.position}
                type="button"
                onClick={() => selectPosition(item.position)}
                draggable={Boolean(item.sponsor)}
                onDragStart={(event) => {
                  setDraggedPosition(item.position);
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", String(item.position));
                }}
                onDragEnd={() => setDraggedPosition(null)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  const sourcePosition = Number(event.dataTransfer.getData("text/plain")) || draggedPosition;
                  if (sourcePosition) moveAdvertisement(sourcePosition, item.position);
                  setDraggedPosition(null);
                }}
                className={`min-h-28 rounded-lg border p-3 text-left transition ${selected ? "border-purple-400 bg-purple-500/10" : "border-zinc-800 bg-zinc-900/60 hover:border-zinc-600"}`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono uppercase">
                  <span>Position {item.position}</span>
                  <span
                    className={
                      item.sponsor && item.isActive
                        ? "text-emerald-400"
                        : item.reservation
                          ? "text-amber-400"
                        : "text-zinc-500"
                    }
                  >
                    {item.sponsor && item.isActive
                      ? "Live"
                      : item.sponsor
                        ? "Paused"
                        : item.reservation
                          ? "Reserved"
                        : "Empty"}
                  </span>
                </div>
                {item.sponsor ? (
                  <>
                    <p className="mt-3 truncate text-sm font-medium text-white">
                      {item.sponsor.name}
                    </p>
                    <p className="mt-1 truncate text-xs text-zinc-500">
                      {item.sponsor.website}
                    </p>
                  </>
                ) : item.reservation ? (
                  <>
                    <p className="mt-3 truncate text-sm font-medium text-amber-300">Reserved</p>
                    <p className="mt-1 truncate text-xs text-zinc-500">{item.reservation.email}</p>
                  </>
                ) : (
                  <div className="mt-5 flex items-center gap-2 text-xs text-zinc-500">
                    <Megaphone className="size-4" />
                    Add advertiser
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          save.mutate();
        }}
        className="h-fit space-y-4 rounded-xl border border-zinc-800 bg-zinc-950/40 p-5"
      >
        <div>
          <p className="text-xs font-mono uppercase text-purple-300">
            Position {selectedPosition}
          </p>
          <h2 className="mt-1 text-base font-semibold">
            {positionIsReserved ? "Customer reservation" : current?.sponsor ? "Edit advertisement" : "Create advertisement"}
          </h2>
        </div>
        {current?.reservation && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-100">
            <p className="font-medium">This position is reserved for {current.reservation.name}.</p>
            <p className="mt-1 text-amber-200/70">{current.reservation.email} will appear here after completing their sponsor profile.</p>
          </div>
        )}
        {current?.sponsor && (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
            <Label className="text-xs text-zinc-300">Move to position</Label>
            <div className="mt-2 flex gap-2">
              <select
                value={moveToPosition}
                onChange={(event) => setMoveToPosition(event.target.value)}
                className="h-9 min-w-0 flex-1 rounded-md border border-zinc-700 bg-zinc-950 px-2 text-sm text-white"
              >
                {data?.positions.filter((item) => item.position !== selectedPosition).map((item) => (
                  <option key={item.position} value={item.position}>Position {item.position}</option>
                ))}
              </select>
              <Button type="button" variant="outline" size="sm" disabled={move.isPending} onClick={() => moveAdvertisement(selectedPosition, Number(moveToPosition))}>
                {move.isPending ? <Loader2 className="size-4 animate-spin" /> : "Move"}
              </Button>
            </div>
          </div>
        )}
        <Field label="Brand name">
          <Input
            required
            minLength={2}
            maxLength={60}
            value={form.name}
            onChange={(event) => updateForm({ ...form, name: event.target.value })}
          />
        </Field>
        <Field label="Description">
          <Textarea
            maxLength={180}
            value={form.description}
            onChange={(event) =>
              updateForm({ ...form, description: event.target.value })
            }
          />
        </Field>
        <Field label="Logo image URL">
          <Input
            required
            type="url"
            placeholder="https://…"
            value={form.logo}
            onChange={(event) => updateForm({ ...form, logo: event.target.value })}
          />
        </Field>
        <Field label="Destination URL">
          <Input
            required
            type="url"
            placeholder="https://…"
            value={form.website}
            onChange={(event) =>
              updateForm({ ...form, website: event.target.value })
            }
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Background">
            <Input
              required
              pattern="#[0-9a-fA-F]{6}"
              value={form.bgColor}
              onChange={(event) =>
                updateForm({ ...form, bgColor: event.target.value })
              }
            />
          </Field>
          <Field label="Text">
            <Input
              required
              pattern="#[0-9a-fA-F]{6}"
              value={form.textColor}
              onChange={(event) =>
                updateForm({ ...form, textColor: event.target.value })
              }
            />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-xs text-zinc-300">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(event) =>
              updateForm({ ...form, isActive: event.target.checked })
            }
          />
          Show this ad publicly
        </label>
        <div
          className="rounded-lg border border-white/10 p-3"
          style={{ backgroundColor: form.bgColor, color: form.textColor }}
        >
          <p className="truncate text-sm font-semibold">
            {form.name || "Brand preview"}
          </p>
          <p className="mt-1 line-clamp-2 text-xs opacity-75">
            {form.description || "Advertisement description"}
          </p>
        </div>
        <Button type="submit" className="w-full" disabled={save.isPending || positionIsReserved}>
          {save.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
          {positionIsReserved ? "Reserved by customer" : current?.sponsor ? "Save advertisement" : "Create advertisement"}
        </Button>
      </form>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-zinc-300">{label}</Label>
      {children}
    </div>
  );
}
