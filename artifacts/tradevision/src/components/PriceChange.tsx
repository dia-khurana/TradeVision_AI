import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PriceChangeProps {
  change: number;
  changePct: number;
  className?: string;
  iconSize?: number;
}

export function PriceChange({ change, changePct, className, iconSize = 16 }: PriceChangeProps) {
  const isPositive = change >= 0;
  const isNegative = change < 0;

  return (
    <div
      className={cn(
        "flex items-center gap-1 font-medium",
        isPositive ? "text-success" : "text-destructive",
        className
      )}
    >
      {isPositive ? (
        <ArrowUpRight style={{ width: iconSize, height: iconSize }} />
      ) : (
        <ArrowDownRight style={{ width: iconSize, height: iconSize }} />
      )}
      <span>
        {isPositive ? "+" : ""}
        {change.toFixed(2)} ({isPositive ? "+" : ""}
        {changePct.toFixed(2)}%)
      </span>
    </div>
  );
}
