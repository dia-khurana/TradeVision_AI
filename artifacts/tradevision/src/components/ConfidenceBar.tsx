import { cn } from "@/lib/utils";

export function ConfidenceBar({ confidence }: { confidence: number }) {
  const pct = Math.max(0, Math.min(100, confidence));
  const tier =
    pct >= 80 ? "strong" : pct >= 65 ? "medium" : "weak";

  const barCls =
    tier === "strong"
      ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
      : tier === "medium"
      ? "bg-gradient-to-r from-amber-500 to-amber-400"
      : "bg-gradient-to-r from-slate-400 to-slate-300";

  const textCls =
    tier === "strong"
      ? "text-emerald-700"
      : tier === "medium"
      ? "text-amber-700"
      : "text-slate-500";

  return (
    <div className="flex items-center gap-2 w-full max-w-[120px]" title={`${tier} conviction`}>
      <div className="h-1.5 w-full rounded-full overflow-hidden bg-slate-100">
        <div className={cn("h-full transition-all", barCls)} style={{ width: `${pct}%` }} />
      </div>
      <span className={cn("text-xs font-extrabold w-8 text-right tabular-nums", textCls)}>
        {pct}%
      </span>
    </div>
  );
}
