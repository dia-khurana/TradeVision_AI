import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function SignalActionBadge({ action }: { action: string }) {
  const isBuy = action.toUpperCase() === "BUY";
  const isSell = action.toUpperCase() === "SELL";
  const isHold = action.toUpperCase() === "HOLD";

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-bold uppercase tracking-wider text-[10px] px-2 py-0.5",
        isBuy && "border-success/50 text-success bg-success/10",
        isSell && "border-destructive/50 text-destructive bg-destructive/10",
        isHold && "border-muted-foreground/30 text-muted-foreground bg-muted/50"
      )}
    >
      {action}
    </Badge>
  );
}
