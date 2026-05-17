import type { FiiDiiResponse } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { fmtCompact } from "@/lib/format";

interface FiiDiiPanelProps {
  data: FiiDiiResponse;
}

export function FiiDiiPanel({ data }: FiiDiiPanelProps) {
  const { fii, dii } = data;

  // Institutional bias from combined net
  const combined = fii.net + dii.net;
  const bias =
    fii.net > 0 && dii.net > 0
      ? "Positive"
      : fii.net < 0 && dii.net < 0
      ? "Negative"
      : "Mixed";
  const biasCls =
    bias === "Positive"
      ? "bg-emerald-50 border-emerald-300 text-emerald-700"
      : bias === "Negative"
      ? "bg-rose-50 border-rose-300 text-rose-700"
      : "bg-amber-50 border-amber-300 text-amber-700";

  const interpretation = (() => {
    if (fii.net > 0 && dii.net > 0)
      return "Both FIIs and DIIs are accumulating — broad institutional confidence.";
    if (fii.net < 0 && dii.net < 0)
      return "Both FIIs and DIIs are net sellers — defensive stance, expect weakness.";
    if (fii.net > 0 && dii.net < 0)
      return "FII buying offset by DII profit-booking — sentiment mixed, watch for follow-through.";
    return "DII support absorbing FII selling — domestic accumulation softens the blow.";
  })();

  const renderRow = (label: string, buy: number, sell: number, net: number) => {
    const total = Math.max(buy + sell, 1);
    return (
      <div className="space-y-1.5">
        <div className="flex justify-between items-baseline">
          <h4 className="font-extrabold tracking-tight text-indigo-700 text-sm">{label}</h4>
          <span
            className={cn(
              "font-extrabold font-mono text-sm",
              net >= 0 ? "text-emerald-600" : "text-rose-600",
            )}
          >
            Net {net >= 0 ? "+" : ""}₹{net.toLocaleString("en-IN")} Cr
          </span>
        </div>
        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-600">
          <span>Buy ₹{fmtCompact(buy)} Cr</span>
          <span>Sell ₹{fmtCompact(sell)} Cr</span>
        </div>
        <div className="flex h-2 w-full rounded-full overflow-hidden bg-slate-100" title={`Buy/Sell flow split`}>
          <div className="bg-emerald-500" style={{ width: `${(buy / total) * 100}%` }} />
          <div className="bg-rose-500" style={{ width: `${(sell / total) * 100}%` }} />
        </div>
      </div>
    );
  };

  return (
    <div className="premium-card h-full flex flex-col" data-testid="fii-dii-panel">
      <div className="px-4 py-2.5 border-b border-indigo-100 flex items-center justify-between">
        <div className="text-sm font-extrabold tracking-tight">FII / DII Activity</div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn("text-[10px] uppercase font-extrabold", biasCls)}>
            {bias}
          </Badge>
          <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
            Today
          </span>
        </div>
      </div>
      <div className="p-3 flex-1 grid grid-cols-1 gap-3 content-start">
        {renderRow("FII", fii.buy, fii.sell, fii.net)}
        {renderRow("DII", dii.buy, dii.sell, dii.net)}
        <div className="rounded-lg bg-slate-50 border border-slate-200 px-2.5 py-2 text-[11px] leading-snug text-slate-700">
          <span className="font-extrabold text-indigo-700">Net flow:</span>{" "}
          <span className="font-mono font-bold">
            {combined >= 0 ? "+" : ""}₹{combined.toLocaleString("en-IN")} Cr
          </span>
          <br />
          <span className="text-slate-600">{interpretation}</span>
        </div>
      </div>
    </div>
  );
}
