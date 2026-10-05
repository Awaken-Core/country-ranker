"use client";

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
  const [countryId, setCountryId] = useState(
    initialCountryId ?? countries[0]?.id ?? "",
  );
  const [voteCount, setVoteCount] = useState(DEFAULT_VOTE_COUNT);

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

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCountry) {
      toast.error("Select a country before purchasing votes.");
      return;
    }

    toast.info("Payment checkout is coming soon.");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-[#0d0d0e] sm:max-w-md">
        <form onSubmit={handleSubmit} className="space-y-5">
          <DialogHeader>
            <DialogTitle>Purchase country votes</DialogTitle>
            <DialogDescription>
              Choose a country and the number of votes you want to purchase.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-4">
            {selectedCountry && (
              <div className="flex items-center gap-2 text-sm font-medium text-amber-200">
                <CountryFlag
                  code={selectedCountry.flag || selectedCountry.code}
                  size="sm"
                />
                <span>{selectedCountry.name}</span>
                <span className="font-mono text-[10px] text-amber-300/60">
                  ({selectedCountry.code})
                </span>
              </div>
            )}
            <div className="mt-1 flex items-end justify-between gap-4">
              <p className="text-2xl font-bold text-white">
                {purchase.voteCount.toLocaleString()} votes
              </p>
              <p className="font-mono text-sm font-semibold text-amber-300">
                ${purchase.price.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purchase-country">Country</Label>
            <Select value={countryId} onValueChange={setCountryId}>
              <SelectTrigger id="purchase-country" className="h-10 w-full">
                <SelectValue placeholder="Select a country">
                  {selectedCountry && (
                    <span className="flex items-center gap-2">
                      <CountryFlag
                        code={selectedCountry.flag || selectedCountry.code}
                        size="sm"
                      />
                      <span>{selectedCountry.name}</span>
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
                    <span>{country.name}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      ({country.code})
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purchase-vote-count">Number of votes</Label>
            <Input
              id="purchase-vote-count"
              name="voteCount"
              type="number"
              min={1}
              max={MAX_PURCHASE_VOTES}
              step={1}
              value={voteCount}
              onChange={(event) => handleVoteCountChange(event.target.value)}
              className="h-8"
            />
            <p className="text-xs text-muted-foreground">
              Votes cost $0.10 each. Maximum{" "}
              {MAX_PURCHASE_VOTES.toLocaleString()}
              {" votes per purchase."}
            </p>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-white/[0.08] bg-black/30 px-4 py-3">
            <div>
              <p className="text-xs text-muted-foreground">You receive</p>
              <p className="font-semibold text-white">
                {purchase.voteCount.toLocaleString()} votes
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="font-mono text-lg font-bold text-amber-300">
                ${purchase.price.toFixed(2)}
              </p>
            </div>
          </div>

          <Button
            type="submit"
            disabled={
              !countryId || voteCount < 1 || voteCount > MAX_PURCHASE_VOTES
            }
            className="h-8 w-full bg-amber-400 font-semibold text-black hover:bg-amber-300"
          >
            Purchase {purchase.voteCount.toLocaleString()} votes for $
            {purchase.price.toFixed(2)}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
