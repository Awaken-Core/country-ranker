"use client";
import {useTranslations, useLocale} from "next-intl";

import {countryName} from '@/i18n/country-name';
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getPriceForVotes, getVotesForPrice } from "@/lib/vote-price";
import { CountryFlag } from "@/components/country-flag";

const DEFAULT_PRICE_USD = 5;
const DEFAULT_VOTE_COUNT = getVotesForPrice(DEFAULT_PRICE_USD).voteCount;
const MAX_PURCHASE_VOTES = 10_000;
type PurchasedVoteType = "UPVOTE" | "DOWNVOTE";

export interface PurchasableCountry {
  id: string;
  name: string;
  code: string;
  flag: string;
}

interface VotePurchaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  countries: PurchasableCountry[];
  initialCountryId: string | null;
}

export default function VotePurchaseModal({
  open,
  onOpenChange,
  countries,
  initialCountryId,
}: VotePurchaseModalProps) {
  const t=useTranslations('UI');
  const locale=useLocale();
  const formatPrice=(price: number) => new Intl.NumberFormat(locale, {style: 'currency', currency: 'USD'}).format(price);
  const [countryId, setCountryId] = useState(
    initialCountryId ?? countries[0]?.id ?? "",
  );
  const [voteCount, setVoteCount] = useState(DEFAULT_VOTE_COUNT);
  const [voteType, setVoteType] = useState<PurchasedVoteType>("UPVOTE");
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const purchase = useMemo(() => getPriceForVotes(voteCount), [voteCount]);
  const selectedCountry = countries.find((country) => country.id === countryId);

  function handleVoteCountChange(value: string) {
    const parsed = Number(value);
    setVoteCount(
      Number.isFinite(parsed)
        ? Math.min(MAX_PURCHASE_VOTES, Math.max(1, Math.floor(parsed)))
        : 1,
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCountry) {
      toast.error(t('selectCountry'));
      return;
    }

    setIsCheckingOut(true);

    try {
      const response = await fetch("/api/v1/purchase/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purchaseType: "VOTE",
          locale,
          countryId: selectedCountry.id,
          voteCount: purchase.voteCount,
          voteType,
        }),
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
            <DialogTitle>{t('purchaseVotes')}</DialogTitle>
            <DialogDescription>
              {t('purchaseDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-4">
            {selectedCountry && (
              <div className="flex items-center gap-2 text-sm font-medium text-amber-200">
                <CountryFlag
                  code={selectedCountry.flag || selectedCountry.code}
                  size="sm"
                />
                <span>{countryName(locale, selectedCountry.code, selectedCountry.name)}</span>
                <span className="font-mono text-[10px] text-amber-300/60">
                  ({selectedCountry.code})
                </span>
              </div>
            )}
            <div className="mt-1 flex items-end justify-between gap-4">
              <p className="text-2xl font-bold text-white">
                {purchase.voteCount.toLocaleString(locale)} {t(voteType === 'UPVOTE' ? 'upvotes' : 'downvotes')}
              </p>
              <p className="font-mono text-sm font-semibold text-amber-300">
                {formatPrice(purchase.price)}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purchase-country">{t('country')}</Label>
            <Select value={countryId} onValueChange={setCountryId}>
              <SelectTrigger id="purchase-country" className="h-10 w-full">
                <SelectValue placeholder={t('selectCountry')}>
                  {selectedCountry && (
                    <span className="flex items-center gap-2">
                      <CountryFlag
                        code={selectedCountry.flag || selectedCountry.code}
                        size="sm"
                      />
                      <span>{countryName(locale, selectedCountry.code, selectedCountry.name)}</span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        ({selectedCountry.code})
                      </span>
                    </span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-72">
                {countries.map((country) => (
                  <SelectItem key={country.id} value={country.id}>
                    <CountryFlag
                      code={country.flag || country.code}
                      size="sm"
                    />
                    <span>{countryName(locale, country.code, country.name)}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      ({country.code})
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">{t('voteType')}</legend>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                aria-pressed={voteType === "UPVOTE"}
                onClick={() => setVoteType("UPVOTE")}
                className={
                  voteType === "UPVOTE"
                    ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/15 hover:text-emerald-300"
                    : "border-white/10 text-zinc-400"
                }
              >
                ▲ {t('upvotes')}
              </Button>
              <Button
                type="button"
                variant="outline"
                aria-pressed={voteType === "DOWNVOTE"}
                onClick={() => setVoteType("DOWNVOTE")}
                className={
                  voteType === "DOWNVOTE"
                    ? "border-rose-500/50 bg-rose-500/10 text-rose-400 hover:bg-rose-500/15 hover:text-rose-300"
                    : "border-white/10 text-zinc-400"
                }
              >
                ▼ {t('downvotes')}
              </Button>
            </div>
          </fieldset>

          <div className="space-y-2">
            <Label htmlFor="purchase-vote-count">{t('voteCount')}</Label>
            <Input
              id="purchase-vote-count"
              name="voteCount"
              type="number"
              min={10}
              max={MAX_PURCHASE_VOTES}
              step={1}
              value={voteCount}
              onChange={(event) => handleVoteCountChange(event.target.value)}
              className="h-8"
            />
            <p className="text-xs text-muted-foreground">
              {t('votePrice', {price: formatPrice(0.1), count: MAX_PURCHASE_VOTES})}
            </p>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-white/[0.08] bg-black/30 px-4 py-3">
            <div>
              <p className="text-xs text-muted-foreground">{t('receive')}</p>
              <p className="font-semibold text-white">
                {purchase.voteCount.toLocaleString(locale)} {t(voteType === 'UPVOTE' ? 'upvotes' : 'downvotes')}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">{t('total')}</p>
              <p className="font-mono text-lg font-bold text-amber-300">
                {formatPrice(purchase.price)}
              </p>
            </div>
          </div>

          <Button
            type="submit"
            disabled={
              isCheckingOut ||
              !countryId ||
              voteCount < 10 ||
              voteCount > MAX_PURCHASE_VOTES
            }
            className="h-8 w-full bg-amber-400 font-semibold text-black hover:bg-amber-300"
          >
            {isCheckingOut
              ? t('checkoutLoading')
              : t('purchaseButton', {count: purchase.voteCount, price: formatPrice(purchase.price)})}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
