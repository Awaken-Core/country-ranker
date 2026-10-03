"use client";

import { useState, useCallback, useRef } from "react";
import type { VoteResult } from "@/server/voting/vote-validation";

export type VoteType = "UPVOTE" | "DOWNVOTE";
export type VoteSource = "FREE" | "PURCHASED";

export interface VoteBalance {
  upvoteRemaining: number;
  downvoteRemaining: number;
  purchasedRemaining: number;
  resetsAt: string;
}

type VotingStatus = "idle" | "loading" | "success" | "error";

function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments where crypto.randomUUID is unavailable
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

interface UseVotingOptions {
  slug: string;
  initialUpvotes: number;
  initialDownvotes: number;
}

export function useVoting({ slug, initialUpvotes, initialDownvotes }: UseVotingOptions) {
  const [balance, setBalance] = useState<VoteBalance | null>(null);
  const [balanceStatus, setBalanceStatus] = useState<VotingStatus>("idle");
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [downvotes, setDownvotes] = useState(initialDownvotes);
  const [voteStatus, setVoteStatus] = useState<VotingStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  // Idempotency key for the current in-flight request. Kept across retries.
  const pendingKeyRef = useRef<string | null>(null);
  const pendingVoteRef = useRef<{ voteType: VoteType; source: VoteSource; count: number } | null>(null);

  const fetchBalance = useCallback(async () => {
    setBalanceStatus("loading");
    try {
      const res = await fetch("/api/v1/votes/me", { cache: "no-store" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setErrorCode((body as { error?: string }).error ?? "FETCH_ERROR");
        setBalanceStatus("error");
        return;
      }
      const data = (await res.json()) as VoteBalance;
      setBalance(data);
      setBalanceStatus("success");
    } catch {
      setBalanceStatus("error");
    }
  }, []);

  const castVote = useCallback(
    async (voteType: VoteType, source: VoteSource = "FREE") => {
      setErrorMessage(null);
      setErrorCode(null);

      // Determine if this is a retry (same vote in flight) or a fresh request
      const isRetry =
        pendingKeyRef.current !== null &&
        pendingVoteRef.current?.voteType === voteType &&
        pendingVoteRef.current?.source === source;

      if (!isRetry) {
        // Fresh vote — generate a new idempotency key
        pendingKeyRef.current = generateUUID();
        pendingVoteRef.current = { voteType, source, count: 1 };
      }

      setVoteStatus("loading");

      try {
        const res = await fetch(`/api/v1/countries/${slug}/vote`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            voteType,
            source,
            count: 1,
            idempotencyKey: pendingKeyRef.current,
          }),
        });

        const body = (await res.json()) as
          | VoteResult
          | { error: string; message: string };

        if (!res.ok) {
          const err = body as { error: string; message: string };
          setErrorCode(err.error);
          setErrorMessage(err.message);
          setVoteStatus("error");
          // Clear pending key only for client errors that are not retryable
          if (res.status !== 500 && res.status !== 429) {
            pendingKeyRef.current = null;
            pendingVoteRef.current = null;
          }
          return;
        }

        const result = body as VoteResult;
        // Update totals from authoritative server response
        setUpvotes(Number(result.country.totalUpvoteCount));
        setDownvotes(Number(result.country.totalDownvoteCount));
        setBalance(result.voting);
        setVoteStatus("success");
        // Clear pending key — vote is committed
        pendingKeyRef.current = null;
        pendingVoteRef.current = null;
      } catch {
        // Network error — keep the idempotency key so the user can retry
        setErrorMessage("Network error. Tap again to retry with the same key.");
        setErrorCode("NETWORK_ERROR");
        setVoteStatus("error");
      }
    },
    [slug],
  );

  return {
    balance,
    balanceStatus,
    upvotes,
    downvotes,
    voteStatus,
    errorCode,
    errorMessage,
    fetchBalance,
    castVote,
    isVoting: voteStatus === "loading",
  };
}
