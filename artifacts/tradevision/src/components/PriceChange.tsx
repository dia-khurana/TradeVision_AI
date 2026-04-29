import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PriceChangeProps {
  change: number;
  changePct: number;
  className?: string;
  iconSize?: number;
}

export function PriceChange({ change, changePct, className, iconSize = 14 }: PriceChangeProps) {
  const up = change >= 0;
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 font-bold tabular-nums",
        up ? "text-emerald-600" : "text-rose-600",
        className,
      )}
    >
      {up ? (
        <ArrowUpRight style={{ width: iconSize, height: iconSize }} />
      ) : (
        <ArrowDownRight style={{ width: iconSize, height: iconSize }} />
      )}
      <span>
        {up ? "+" : ""}
        {change.toFixed(2)} ({up ? "+" : ""}
        {changePct.toFixed(2)}%)
      </span>
    </div>
  );
}
