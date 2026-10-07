"use client";
import {useTranslations} from "next-intl";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/auth-client";

type VoteType = "UPVOTE" | "DOWNVOTE";

interface LeaderboardVoteActionsProps {
  slug: string;
  countryName: string;
  onVoteSuccess: (countryName: string, voteType: VoteType) => void;
  onOpenPurchase: () => void;
}

export function LeaderboardVoteActions({
  slug,
  countryName,
  onVoteSuccess,
  onOpenPurchase,
}: LeaderboardVoteActionsProps) {
  const t=useTranslations('UI');
  const router = useRouter();
  const { data: session, isPending: isSessionPending } = useSession();
  const [pending, setPending] = useState<VoteType | null>(null);
  const [userVoted, setUserVoted] = useState<VoteType | null>(null);
  const requestKeyRef = useRef<string | null>(null);
  const requestVoteRef = useRef<VoteType | null>(null);

  async function vote(voteType: VoteType) {
    if (pending) return;

    if (isSessionPending) {
      toast.info(t('loading'));
      return;
    }

    if (!session?.user) {
      window.dispatchEvent(new Event("country-rank:open-sign-in"));
      return;
    }

    if (requestVoteRef.current !== voteType || !requestKeyRef.current) {
      requestKeyRef.current = crypto.randomUUID();
      requestVoteRef.current = voteType;
    }

    setPending(voteType);

    try {
      const response = await fetch(`/api/v1/countries/${slug}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voteType,
          source: "FREE",
          count: 1,
          idempotencyKey: requestKeyRef.current,
        }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;

        toast.error(
          body?.message ??
            t('dailyReset', {time: '00:00 UTC'}),
        );

        if (response.status !== 429 && response.status !== 500) {
          requestKeyRef.current = null;
          requestVoteRef.current = null;
        }
        return;
      }

      setUserVoted(voteType);
      requestKeyRef.current = null;
      requestVoteRef.current = null;
      onVoteSuccess(countryName, voteType);
      router.refresh();
    } catch {
      // Retain the key so a retry cannot create a duplicate vote.
      toast.error(t('connectionError'));
    } finally {
      setPending(null);
    }
  }

  function purchaseVotes() {
    onOpenPurchase();
  }

  const isUpvoted = userVoted === "UPVOTE";
  const isDownvoted = userVoted === "DOWNVOTE";

  return (
    <div
      className="relative flex items-center justify-end gap-2"
      onClick={(event) => event.preventDefault()}
    >
      <motion.button
        type="button"
        title={t('upvotes')}
        aria-label={`${t('upvotes')} ${countryName}`}
        disabled={pending !== null}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.92 }}
        transition={{ type: "spring", stiffness: 450, damping: 25 }}
        onClick={() => void vote("UPVOTE")}
        className={cn(
          "flex size-8 shrink-0 cursor-pointer select-none items-center justify-center rounded-lg border transition-all",
          isUpvoted
            ? "border-[#00DF81] bg-[#00DF81] text-[#041E12] shadow-[0_0_12px_rgba(0,223,129,0.35)]"
            : "border-[#005230] bg-[#061A12] text-[#00DF81] hover:border-[#008f55] hover:bg-[#09261a]",
          "disabled:cursor-not-allowed disabled:opacity-40",
        )}
      >
        {pending === "UPVOTE" ? (
          <Loader2
            className={cn(
              "size-3.5 animate-spin",
              isUpvoted ? "text-[#041E12]" : "text-[#00DF81]",
            )}
          />
        ) : (
          <span className="-translate-y-px font-sans text-[11px] font-black leading-none">
            ▲
          </span>
        )}
      </motion.button>

      <motion.button
        type="button"
        title={t('downvotes')}
        aria-label={`${t('downvotes')} ${countryName}`}
        disabled={pending !== null}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.92 }}
        transition={{ type: "spring", stiffness: 450, damping: 25 }}
        onClick={() => void vote("DOWNVOTE")}
        className={cn(
          "flex size-8 shrink-0 cursor-pointer select-none items-center justify-center rounded-lg border transition-all",
          isDownvoted
            ? "border-[#FF4D4D] bg-[#FF4D4D] text-[#1E0507] shadow-[0_0_12px_rgba(255,77,77,0.35)]"
            : "border-[#4A0D15] bg-[#1A070B] text-[#FF4D4D] hover:border-[#7A1624] hover:bg-[#280B11]",
          "disabled:cursor-not-allowed disabled:opacity-40",
        )}
      >
        {pending === "DOWNVOTE" ? (
          <Loader2
            className={cn(
              "size-3.5 animate-spin",
              isDownvoted ? "text-[#1E0507]" : "text-[#FF4D4D]",
            )}
          />
        ) : (
          <span className="translate-y-px font-sans text-[11px] font-black leading-none">
            ▼
          </span>
        )}
      </motion.button>

      <motion.button
        type="button"
        title={t('purchaseVotes')}
        aria-label={t('purchaseVotes')}
        disabled={pending !== null}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.92 }}
        transition={{ type: "spring", stiffness: 450, damping: 25 }}
        onClick={purchaseVotes}
        className="flex h-8 min-w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-amber-500/35 bg-amber-500/10 px-2 font-mono text-[11px] font-medium text-amber-300 transition-all hover:border-amber-400/60 hover:bg-amber-500/15 disabled:cursor-not-allowed disabled:opacity-40"
      >
        $5
      </motion.button>
    </div>
  );
}
