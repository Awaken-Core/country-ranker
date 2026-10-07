"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSession } from "@/lib/auth-client";

interface BecomeSponsorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function BecomeSponsorModal({
  open,
  onOpenChange,
}: BecomeSponsorModalProps) {
  const locale = useLocale();
  const t = useTranslations("UI");
  const { data: session, isPending: sessionPending } = useSession();
  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/v1/purchase/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purchaseType: "SPONSOR_NEW", locale }),
      });
      const result = (await response.json()) as {
        checkoutUrl?: string;
        error?: string;
      };
      if (!response.ok || !result.checkoutUrl) {
        throw new Error(result.error || t("checkoutError"));
      }
      return result.checkoutUrl;
    },
    onSuccess: (checkoutUrl) => window.location.assign(checkoutUrl),
    onError: (error) => toast.error(error.message || t("checkoutError")),
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) {
      toast.error(t("signInVote"));
      return;
    }
    if (session.user.role === "CUSTOMER") {
      window.location.assign(`/${locale}/sponsor`);
      return;
    }
    if (session.user.role !== "USER") {
      toast.error(t("connectionError"));
      return;
    }
    checkoutMutation.mutate();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-[#0d0d0e] sm:max-w-md">
        <form onSubmit={handleSubmit} className="space-y-5">
          <DialogHeader>
            <DialogTitle>{t("advertise")}</DialogTitle>
            <DialogDescription>
              {t("sponsorReach")}
            </DialogDescription>
          </DialogHeader>

          <Button
            type="submit"
            disabled={sessionPending || checkoutMutation.isPending}
            className="h-9 w-full bg-amber-400 font-semibold text-black hover:bg-amber-300"
          >
            {checkoutMutation.isPending
              ? t("checkoutLoading")
              : session?.user.role === "CUSTOMER"
                ? t("sponsorWorkspace")
                : t("reservePrice", { price: new Intl.NumberFormat(locale, { style: "currency", currency: "USD" }).format(100) })}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
