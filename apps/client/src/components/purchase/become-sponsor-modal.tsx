"use client";

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

const BecomeSponsorModal = ({
  open,
  onOpenChange,
}: BecomeSponsorModalProps) => {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    toast.success("Thank you for your interest in sponsoring!");
    onOpenChange(false);
  };

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
            className="h-8 w-full bg-amber-400 font-semibold text-black hover:bg-amber-300"
          >
            Lock the next spot for $100
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BecomeSponsorModal;
