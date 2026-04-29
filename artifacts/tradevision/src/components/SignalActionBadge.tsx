import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function SignalActionBadge({ action }: { action: string }) {
  const a = (action || "").toUpperCase();
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-extrabold uppercase tracking-wider text-[10px] px-2 py-0.5 border",
        a === "BUY" && "border-emerald-300 text-emerald-700 bg-emerald-50",
        a === "SELL" && "border-rose-300 text-rose-700 bg-rose-50",
        a === "HOLD" && "border-slate-300 text-slate-600 bg-slate-50",
      )}
    >
      {a}
    </Badge>
  );
}
