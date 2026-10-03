import React from "react";
import { AdCard } from "./ad-card";
import { LEFT_ADS, RIGHT_ADS } from "./ad-data";
import { cn } from "@/lib/utils";

interface AdRailProps {
  side: "left" | "right";
  className?: string;
}

export const AdRail: React.FC<AdRailProps> = ({ side, className }) => {
  const ads = side === "left" ? LEFT_ADS : RIGHT_ADS;

  return (
    <aside
      aria-label={`${side} promotional rail`}
      className={cn("flex flex-col gap-2 w-[190px] xl:w-[210px] 2xl:w-[230px] h-full shrink-0 select-none", className)}
    >
      {ads.map((ad) => (
        <AdCard key={ad.id} ad={ad} />
      ))}
    </aside>
  );
};
