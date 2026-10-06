"use client";

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
  const { data: session, isPending: sessionPending } = useSession();
  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/v1/purchase/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purchaseType: "SPONSOR_NEW" }),
      });
      const result = (await response.json()) as {
        checkoutUrl?: string;
        error?: string;
      };
      if (!response.ok || !result.checkoutUrl) {
        throw new Error(result.error || "Could not start checkout.");
      }
      return result.checkoutUrl;
    },
    onSuccess: (checkoutUrl) => window.location.assign(checkoutUrl),
    onError: (error) => toast.error(error.message),
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) {
      toast.error("Sign in before becoming a sponsor.");
      return;
    }
    if (session.user.role === "CUSTOMER") {
      window.location.assign("/sponsor");
      return;
    }
    if (session.user.role !== "USER") {
      toast.error("This account cannot create a sponsorship.");
      return;
    }
    checkoutMutation.mutate();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-[#0d0d0e] sm:max-w-md">
        <form onSubmit={handleSubmit} className="space-y-5">
          <DialogHeader>
            <DialogTitle>Advertise on Country</DialogTitle>
            <DialogDescription>
              Reach 200K+ entrepreneurs and founders every month
            </DialogDescription>
          </DialogHeader>

          <Button
            type="submit"
            disabled={sessionPending || checkoutMutation.isPending}
            className="h-9 w-full bg-amber-400 font-semibold text-black hover:bg-amber-300"
          >
            {checkoutMutation.isPending
              ? "Opening secure checkout..."
              : session?.user.role === "CUSTOMER"
                ? "Manage sponsor"
                : "Lock the next spot for $100"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
