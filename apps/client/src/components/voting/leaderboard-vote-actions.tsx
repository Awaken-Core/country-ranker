"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/auth-client";

interface LeaderboardVoteActionsProps {
  slug: string;
  onMessageChange?: (hasMessage: boolean) => void;
}

export function LeaderboardVoteActions({ slug, onMessageChange }: LeaderboardVoteActionsProps) {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } = useSession();
  const [pending, setPending] = useState<"UPVOTE" | "DOWNVOTE" | null>(null);
  const [userVoted, setUserVoted] = useState<"UPVOTE" | "DOWNVOTE" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    onMessageChange?.(!!message);
  }, [message, onMessageChange]);

  useEffect(() => {
    if (!message) return;

    const dismiss = () => setMessage(null);
    const dismissOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismiss();
    };
    const timeout = window.setTimeout(dismiss, 5000);

    const clickTimer = window.setTimeout(() => {
      document.addEventListener("pointerdown", dismiss, { once: true });
    }, 0);
    document.addEventListener("keydown", dismissOnEscape);

    return () => {
      window.clearTimeout(timeout);
      window.clearTimeout(clickTimer);
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", dismissOnEscape);
    };
  }, [message]);

  async function vote(voteType: "UPVOTE" | "DOWNVOTE") {
    if (pending) return;
    if (isSessionPending) {
      setMessage("Checking sign-in status…");
      return;
    }
    if (!session?.user) {
      window.dispatchEvent(new Event("country-rank:open-sign-in"));
      return;
    }
    setPending(voteType);
    setMessage(null);
    try {
      const response = await fetch(`/api/v1/countries/${slug}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voteType,
          source: "FREE",
          count: 1,
          idempotencyKey: crypto.randomUUID(),
        }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null;
        setMessage(body?.message ?? "You've used today's three free votes. They reset at 00:00 UTC.");
        return;
      }
      setUserVoted(voteType);
      router.refresh();
    } catch {
      setMessage("Could not reach voting service. Try again.");
    } finally {
      setPending(null);
    }
  }

  const isUpvoted = userVoted === "UPVOTE";
  const isDownvoted = userVoted === "DOWNVOTE";

  return (
    <div
      className="relative flex items-center justify-end gap-2"
      onClick={(event) => event.preventDefault()}
    >
      {/* Upvote Button with solid triangle ▲ */}
      <motion.button
        type="button"
        title="Upvote"
        aria-label="Upvote this country"
        disabled={pending !== null}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.92 }}
        transition={{ type: "spring", stiffness: 450, damping: 25 }}
        onClick={() => void vote("UPVOTE")}
        className={cn(
          "w-8 h-8 rounded-lg border flex items-center justify-center transition-all cursor-pointer shrink-0 select-none",
          isUpvoted
            ? "border-[#00DF81] bg-[#00DF81] text-[#041E12] shadow-[0_0_12px_rgba(0,223,129,0.35)]"
            : "border-[#005230] bg-[#061A12] text-[#00DF81] hover:border-[#008f55] hover:bg-[#09261a]",
          "disabled:opacity-40 disabled:cursor-not-allowed"
        )}
      >
        {pending === "UPVOTE" ? (
          <Loader2 className={cn("size-3.5 animate-spin", isUpvoted ? "text-[#041E12]" : "text-[#00DF81]")} />
        ) : (
          <span className="text-[11px] font-sans font-black leading-none translate-y-[-0.5px]">▲</span>
        )}
      </motion.button>

      {/* Downvote Button with solid triangle ▼ */}
      <motion.button
        type="button"
        title="Downvote"
        aria-label="Downvote this country"
        disabled={pending !== null}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.92 }}
        transition={{ type: "spring", stiffness: 450, damping: 25 }}
        onClick={() => void vote("DOWNVOTE")}
        className={cn(
          "w-8 h-8 rounded-lg border flex items-center justify-center transition-all cursor-pointer shrink-0 select-none",
          isDownvoted
            ? "border-[#FF4D4D] bg-[#FF4D4D] text-[#1E0507] shadow-[0_0_12px_rgba(255,77,77,0.35)]"
            : "border-[#4A0D15] bg-[#1A070B] text-[#FF4D4D] hover:border-[#7A1624] hover:bg-[#280B11]",
          "disabled:opacity-40 disabled:cursor-not-allowed"
        )}
      >
        {pending === "DOWNVOTE" ? (
          <Loader2 className={cn("size-3.5 animate-spin", isDownvoted ? "text-[#1E0507]" : "text-[#FF4D4D]")} />
        ) : (
          <span className="text-[11px] font-sans font-black leading-none translate-y-[0.5px]">▼</span>
        )}
      </motion.button>

      {/* Fully Opaque Tooltip Popup (Above other rows, crystal clear text) */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.12 }}
            role="alert"
            className="absolute right-0 top-10 z-[100] w-64 rounded-lg border border-zinc-700/80 bg-[#141416] p-3 shadow-2xl font-mono text-xs text-[#ff8080] leading-relaxed select-none pointer-events-auto"
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
