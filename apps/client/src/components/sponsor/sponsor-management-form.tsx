"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { uploadthingsURI } from "@/lib/constants";
import { uploadFiles } from "@/lib/uploadthing-client";
import { useSponsorDraftStore } from "@/stores/sponsor-draft-store";

interface SponsorValue {
  id: string;
  name: string;
  description: string | null;
  logo: string;
  bgColor: string | null;
  textColor: string | null;
  website: string;
}

interface Props {
  initialSponsor: SponsorValue | null;
  activeSlot: boolean;
  billingCycleActive: boolean;
  billingEndsAt: string | null;
}

function logoUrl(logo: string) {
  return logo.startsWith("http") || logo.startsWith("blob:")
    ? logo
    : `${uploadthingsURI}/f/${logo}`;
}

async function responseJson<Response>(response: globalThis.Response) {
  const result = (await response.json()) as Response & { error?: string };
  if (!response.ok) throw new Error(result.error || "Request failed.");
  return result;
}

export function SponsorManagementForm({
  initialSponsor,
  activeSlot,
  billingCycleActive,
  billingEndsAt,
}: Props) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const draft = useSponsorDraftStore();
  const canRenew = Boolean(initialSponsor && (!activeSlot || !billingCycleActive));

  useEffect(() => {
    draft.initialize({
      name: initialSponsor?.name ?? "",
      description: initialSponsor?.description ?? "",
      website: initialSponsor?.website ?? "",
      logo: initialSponsor?.logo ?? "",
      bgColor: initialSponsor?.bgColor ?? "#171717",
      textColor: initialSponsor?.textColor ?? "#ffffff",
    });
    // The server snapshot should initialize this store only when it changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSponsor]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      let uploadedLogo = draft.logo;
      if (draft.logoFile) {
        const uploads = await uploadFiles("imageUploader", {
          files: [draft.logoFile],
        });
        uploadedLogo = uploads[0]?.ufsUrl ?? "";
      }
      if (!uploadedLogo) throw new Error("Select a sponsor logo.");

      const response = await fetch("/api/v1/sponsor", {
        method: initialSponsor ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name,
          description: draft.description,
          website: draft.website,
          logo: uploadedLogo,
          bgColor: draft.bgColor,
          textColor: draft.textColor,
        }),
      });
      return responseJson<{ sponsor: SponsorValue }>(response);
    },
    onSuccess: ({ sponsor }) => {
      draft.initialize({
        name: sponsor.name,
        description: sponsor.description ?? "",
        website: sponsor.website,
        logo: sponsor.logo,
        bgColor: sponsor.bgColor ?? "#171717",
        textColor: sponsor.textColor ?? "#ffffff",
      });
      void queryClient.invalidateQueries({ queryKey: ["sponsor"] });
      router.refresh();
      toast.success("Sponsor card saved.");
    },
    onError: (error) => toast.error(error.message),
  });

  const renewMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/v1/purchase/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purchaseType: "SPONSOR_RENEW" }),
      });
      return responseJson<{ checkoutUrl: string }>(response);
    },
    onSuccess: ({ checkoutUrl }) => window.location.assign(checkoutUrl),
    onError: (error) => toast.error(error.message),
  });

  function selectLogo(file: File | undefined) {
    if (!file) return;
    if (draft.logo.startsWith("blob:")) URL.revokeObjectURL(draft.logo);
    draft.update("logoFile", file);
    draft.update("logo", URL.createObjectURL(file));
  }

  return (
    <div className="grid min-h-0 gap-5 overflow-y-auto py-5 lg:grid-cols-[1fr_325px]">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          saveMutation.mutate();
        }}
        className="space-y-4 rounded-xl border border-white/[0.08] bg-black/20 p-5"
      >
        <div className="space-y-2">
          <Label htmlFor="sponsor-name">Name</Label>
          <Input
            id="sponsor-name"
            required
            minLength={2}
            maxLength={60}
            value={draft.name}
            onChange={(event) => draft.update("name", event.target.value)}
            placeholder="Your brand"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sponsor-description">Description</Label>
          <Textarea
            id="sponsor-description"
            maxLength={180}
            value={draft.description}
            onChange={(event) => draft.update("description", event.target.value)}
            placeholder="A short description for your sponsor card"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sponsor-website">Website</Label>
          <Input
            id="sponsor-website"
            type="url"
            required
            value={draft.website}
            onChange={(event) => draft.update("website", event.target.value)}
            placeholder="https://example.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sponsor-logo">Logo</Label>
          <Input
            id="sponsor-logo"
            type="file"
            accept="image/*"
            required={!draft.logo}
            onChange={(event) => selectLogo(event.target.files?.[0])}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <ColorField
            id="sponsor-bg-color"
            label="Background color"
            value={draft.bgColor}
            onChange={(value) => draft.update("bgColor", value)}
          />
          <ColorField
            id="sponsor-text-color"
            label="Text color"
            value={draft.textColor}
            onChange={(value) => draft.update("textColor", value)}
          />
        </div>

        <Button
          type="submit"
          disabled={saveMutation.isPending}
          className="w-full bg-amber-400 font-semibold text-black hover:bg-amber-300"
        >
          {saveMutation.isPending ? "Saving sponsor..." : "Save sponsor card"}
        </Button>
      </form>

      <aside className="space-y-3">
        <div
          className="flex min-h-60 flex-col items-center justify-between rounded-xl border border-white/10 p-5 text-center"
          style={{ backgroundColor: draft.bgColor, color: draft.textColor }}
        >
          <div>
            {draft.logo ? (
              <div className="relative mx-auto mb-3 size-14 overflow-hidden rounded-lg bg-white/10">
                <Image
                  src={logoUrl(draft.logo)}
                  alt=""
                  fill
                  unoptimized={draft.logo.startsWith("blob:")}
                  sizes="56px"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="mx-auto mb-3 size-14 rounded-lg bg-white/10" />
            )}
            <p className="font-semibold">{draft.name || "Sponsor preview"}</p>
            <p className="mt-2 text-xs opacity-70">
              {draft.description || "Your description will appear here."}
            </p>
          </div>
          <span className="font-mono text-[9px] opacity-50">Promoted ↗</span>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-black/20 p-4 text-xs">
          <StatusRow label="Slot" active={activeSlot} />
          <StatusRow label="Billing cycle" active={billingCycleActive} />
          {billingEndsAt && (
            <div className="mt-2 flex justify-between gap-4">
              <span className="text-zinc-500">Billing ends</span>
              <span className="text-zinc-300">
                {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
                  new Date(billingEndsAt),
                )}
              </span>
            </div>
          )}
        </div>

        {canRenew && (
          <Button
            type="button"
            onClick={() => renewMutation.mutate()}
            disabled={renewMutation.isPending}
            className="w-full bg-amber-400 font-semibold text-black hover:bg-amber-300"
          >
            {renewMutation.isPending
              ? "Opening checkout..."
              : "Renew sponsor for $100"}
          </Button>
        )}
      </aside>
    </div>
  );
}

function ColorField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        <Input
          id={id}
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-9 w-12 cursor-pointer p-1"
        />
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          pattern="#[0-9a-fA-F]{6}"
          aria-label={`${label} hex value`}
          className="font-mono"
        />
      </div>
    </div>
  );
}

function StatusRow({ label, active }: { label: string; active: boolean }) {
  return (
    <div className="mt-2 flex justify-between gap-4 first:mt-0">
      <span className="text-zinc-500">{label}</span>
      <span className={active ? "text-emerald-400" : "text-zinc-400"}>
        {active ? "Active" : "Inactive"}
      </span>
    </div>
  );
}
