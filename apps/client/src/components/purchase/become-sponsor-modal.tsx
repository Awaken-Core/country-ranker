"use client";
import {useTranslations, useLocale} from "next-intl";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BecomeSponsorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function BecomeSponsorModal({
  open,
  onOpenChange,
}: BecomeSponsorModalProps) {
  const t=useTranslations('UI');
  const locale=useLocale();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsCheckingOut(true);

    try {
      const response = await fetch("/api/v1/purchase/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purchaseType: "SPONSOR", locale }),
      });
      const result = (await response.json()) as {
        checkoutUrl?: string;
        error?: string;
      };

      if (!response.ok || !result.checkoutUrl) {
        throw new Error(result.error || t('checkoutError'));
      }

      window.location.assign(result.checkoutUrl);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t('checkoutError'),
      );
      setIsCheckingOut(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-[#0d0d0e] sm:max-w-md">
        <form onSubmit={handleSubmit} className="space-y-5">
          <DialogHeader>
            <DialogTitle>{t('advertise')}</DialogTitle>
            <DialogDescription>
              {t('sponsorReach')}
            </DialogDescription>
          </DialogHeader>

          <Button
            type="submit"
            disabled={isCheckingOut}
            className="h-9 w-full bg-amber-400 font-semibold text-black hover:bg-amber-300"
          >
            {isCheckingOut
              ? t('checkoutLoading')
              : t('reservePrice', {price: new Intl.NumberFormat(locale, {style: 'currency', currency: 'USD'}).format(100)})}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
