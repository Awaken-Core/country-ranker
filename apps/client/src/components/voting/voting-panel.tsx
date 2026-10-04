"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronUp, ChevronDown, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/auth-client";
import { useVoting } from "@/hooks/use-voting";
import { Confetti, type ConfettiRef } from "@/components/ui/confetti";

interface VotingPanelProps {
  slug: string;
  countryName: string;
  initialUpvotes: number;
  initialDownvotes: number;
}

/** Formats a UTC ISO timestamp as "HH:MM UTC" */
function formatResetTime(iso: string): string {
  const d = new Date(iso);
  const h = String(d.getUTCHours()).padStart(2, "0");
  const m = String(d.getUTCMinutes()).padStart(2, "0");
  return `${h}:${m} UTC`;
}

export function VotingPanel({
  slug,
  countryName,
  initialUpvotes,
  initialDownvotes,
}: VotingPanelProps) {
  const confettiRef = useRef<ConfettiRef>(null);
  const { data: session, isPending: isSessionPending } = useSession();

  const {
    balance,
    balanceStatus,
    upvotes,
    downvotes,
    voteStatus,
    errorCode,
    errorMessage,
    fetchBalance,
    castVote,
    isVoting,
  } = useVoting({ slug, initialUpvotes, initialDownvotes });

  // Fetch balance once session is known and user is signed in
  useEffect(() => {
    if (!isSessionPending && session?.user) {
      void fetchBalance();
    }
  }, [isSessionPending, session?.user, fetchBalance]);

  const isLoggedIn = !isSessionPending && !!session?.user;
  const upvoteRemaining = balance?.upvoteRemaining ?? 0;
  const downvoteRemaining = balance?.downvoteRemaining ?? 0;
  const purchasedRemaining = balance?.purchasedRemaining ?? 0;

  async function handleVote(voteType: "UPVOTE" | "DOWNVOTE") {
    const freeRemaining =
      voteType === "UPVOTE" ? upvoteRemaining : downvoteRemaining;
    const result = await castVote(
      voteType,
      freeRemaining > 0 ? "FREE" : "PURCHASED",
    );
    if (!result) return;

    void confettiRef.current?.fire({
      particleCount: 80,
      spread: 65,
      startVelocity: 35,
      origin: { x: 0.5, y: 0.65 },
      colors:
        voteType === "UPVOTE"
          ? ["#00df81", "#33ffaa", "#ffffff"]
          : ["#ff4d4d", "#ff8080", "#ffffff"],
    });
    toast.success(
      `🎉 You ${voteType === "UPVOTE" ? "upvoted" : "downvoted"} ${countryName}`,
    );
  }

  // ── Not signed in ─────────────────────────────────────────────────────────
  if (!isSessionPending && !session?.user) {
    return (
      <div className="p-4 rounded-xl border border-dashed border-white/[0.08] bg-[#0A0A0A] text-center font-mono">
        <p className="text-xs text-zinc-400">
          Sign in to cast your 3 free sovereign votes per day.
        </p>
      </div>
    );
  }

  // ── Session loading ────────────────────────────────────────────────────────
  if (isSessionPending) {
    return (
      <div className="p-4 rounded-xl border border-white/[0.06] bg-[#0A0A0A] animate-pulse">
        <div className="h-3 w-32 bg-zinc-800 rounded mb-3" />
        <div className="flex gap-3">
          <div className="h-9 w-28 bg-zinc-800/60 rounded-lg" />
          <div className="h-9 w-28 bg-zinc-800/60 rounded-lg" />
        </div>
      </div>
    );
  }

  // ── Error fetching balance ─────────────────────────────────────────────────
  if (balanceStatus === "error" && errorCode === "UNAUTHORIZED") {
    return (
      <div className="p-4 rounded-xl border border-dashed border-white/[0.08] bg-[#0A0A0A] text-center font-mono">
        <p className="text-xs text-zinc-400">Sign in to vote.</p>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl border border-white/[0.06] bg-[#090909] space-y-3.5">
      <Confetti
        ref={confettiRef}
        manualstart
        className="pointer-events-none fixed inset-0 z-[9999] size-full"
      />
      {/* Header row: label + allowance */}
      <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-zinc-400">
        <span>Cast your vote</span>

        {isLoggedIn && (
          <span>
            {balanceStatus === "loading" && balance === null ? (
              <span className="animate-pulse text-zinc-600">checking…</span>
            ) : balance ? (
              <>
                <span
                  className={cn(
                    "font-semibold tabular-nums",
                    upvoteRemaining > 0 ? "text-emerald-400" : "text-zinc-500",
                  )}
                >
                  {upvoteRemaining}
                </span>
                <span className="text-zinc-500"> upvotes left</span>
                <span className="text-zinc-700 mx-1.5">·</span>
                <span
                  className={cn(
                    "font-semibold tabular-nums",
                    downvoteRemaining > 0 ? "text-red-400" : "text-zinc-500",
                  )}
                >
                  {downvoteRemaining}
                </span>
                <span className="text-zinc-500"> downvotes left</span>
                {purchasedRemaining > 0 && (
                  <>
                    <span className="text-zinc-700 mx-1.5">·</span>
                    <span className="text-amber-400 font-semibold tabular-nums">
                      {purchasedRemaining}
                    </span>
                    <span className="text-zinc-500"> paid</span>
                  </>
                )}
              </>
            ) : null}
          </span>
        )}
      </div>

      {/* Vote buttons */}
      <div className="flex gap-3">
        <VoteButton
          direction="up"
          count={upvotes}
          disabled={
            !isLoggedIn ||
            (upvoteRemaining === 0 && purchasedRemaining === 0) ||
            isVoting
          }
          loading={isVoting}
          onClick={() => void handleVote("UPVOTE")}
        />
        <VoteButton
          direction="down"
          count={downvotes}
          disabled={
            !isLoggedIn ||
            (downvoteRemaining === 0 && purchasedRemaining === 0) ||
            isVoting
          }
          loading={isVoting}
          onClick={() => void handleVote("DOWNVOTE")}
        />
      </div>

      {/* Status messages with AnimatePresence */}
      <AnimatePresence mode="wait">
        {voteStatus === "error" && errorMessage && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: -3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="flex items-center gap-1.5 font-mono text-[11px] text-red-400"
          >
            <AlertCircle className="size-3.5" />
            <span>{errorMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset time / limit reached */}
      {isLoggedIn &&
        balance &&
        upvoteRemaining === 0 &&
        downvoteRemaining === 0 &&
        purchasedRemaining === 0 && (
          <p className="font-mono text-[10px] text-zinc-500">
            Daily limit reached. Resets at{" "}
            <span className="text-zinc-400">
              {formatResetTime(balance.resetsAt)}
            </span>
            .
          </p>
        )}
    </div>
  );
}

// ── Sub-component ─────────────────────────────────────────────────────────────

interface VoteButtonProps {
  direction: "up" | "down";
  count: number;
  disabled: boolean;
  loading: boolean;
  onClick: () => void;
}

function VoteButton({
  direction,
  count,
  disabled,
  loading,
  onClick,
}: VoteButtonProps) {
  const isUp = direction === "up";

  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={onClick}
      whileHover={!disabled ? { scale: 1.02 } : undefined}
      whileTap={!disabled ? { scale: 0.95 } : undefined}
      transition={{ type: "spring", stiffness: 450, damping: 25 }}
      className={cn(
        "group flex items-center gap-2 px-4 py-2.5 rounded-lg border font-mono text-xs font-semibold transition-colors cursor-pointer",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        isUp
          ? "border-[#005e38] bg-[#04160e] text-[#00e599] hover:enabled:border-[#008f55] hover:enabled:bg-[#072417] hover:enabled:text-[#33ffaa]"
          : "border-[#5a141b] bg-[#160507] text-[#ff4d4d] hover:enabled:border-[#801c26] hover:enabled:bg-[#25080c] hover:enabled:text-[#ff6666]",
      )}
    >
      <span className="flex items-center justify-center size-4 select-none">
        {loading ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : isUp ? (
          <ChevronUp className="size-4 stroke-[2.5]" />
        ) : (
          <ChevronDown className="size-4 stroke-[2.5]" />
        )}
      </span>
      <span className="tabular-nums">{count.toLocaleString()}</span>
    </motion.button>
  );
}
