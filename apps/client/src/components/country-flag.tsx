import * as React from "react";
import { cn } from "@/lib/utils";

interface CountryFlagProps extends React.HTMLAttributes<HTMLSpanElement> {
  code: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  squared?: boolean;
}

const sizeClasses = {
  xs: "text-xs",
  sm: "text-sm",
  md: "text-base",
  lg: "text-xl",
  xl: "text-3xl",
};

export const CountryFlag: React.FC<CountryFlagProps> = ({
  code,
  size = "md",
  squared = false,
  className,
  ...props
}) => {
  if (!code || typeof code !== "string") {
    return (
      <span
        aria-hidden="true"
        className={cn(
          "inline-flex items-center justify-center rounded bg-muted text-muted-foreground font-mono text-[10px]",
          sizeClasses[size],
          className
        )}
        {...props}
      >
        --
      </span>
    );
  }

  const safeCode = code.trim().toLowerCase();

  return (
    <span
      role="img"
      aria-label={`${code.toUpperCase()} flag`}
      className={cn(
        "fi rounded-[2px] shadow-sm inline-block shrink-0",
        `fi-${safeCode}`,
        squared && "fis",
        sizeClasses[size],
        className
      )}
      {...props}
    />
  );
};
