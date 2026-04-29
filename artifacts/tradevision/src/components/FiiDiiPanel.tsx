import type { FiiDiiResponse } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

interface FiiDiiPanelProps {
  data: FiiDiiResponse;
}

export function FiiDiiPanel({ data }: FiiDiiPanelProps) {
  const { fii, dii } = data;

  const renderRow = (label: string, buy: number, sell: number, net: number) => {
    const total = Math.max(buy + sell, 1);
    return (
      <div className="space-y-2">
        <div className="flex justify-between items-baseline">
          <h4 className="font-extrabold tracking-tight text-indigo-700">{label}</h4>
          <span className={cn("font-bold font-mono text-sm", net >= 0 ? "text-emerald-600" : "text-rose-600")}>
            {net >= 0 ? "+" : ""}₹{net.toLocaleString("en-IN")} Cr
          </span>
        </div>
        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          <span>Buy ₹{buy.toLocaleString("en-IN")}</span>
          <span>Sell ₹{sell.toLocaleString("en-IN")}</span>
        </div>
        <div className="flex h-2 w-full rounded-full overflow-hidden bg-indigo-100">
          <div className="bg-emerald-500" style={{ width: `${(buy / total) * 100}%` }} />
          <div className="bg-rose-500" style={{ width: `${(sell / total) * 100}%` }} />
        </div>
      </div>
    );
  };

  return (
    <div className="premium-card h-full flex flex-col">
      <div className="px-4 py-3 border-b border-indigo-100 flex items-center justify-between">
        <div className="text-sm font-bold tracking-tight">FII / DII Activity</div>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Today</span>
      </div>
      <div className="p-4 flex-1 grid grid-cols-1 gap-5 content-start">
        {renderRow("FII", fii.buy, fii.sell, fii.net)}
        {renderRow("DII", dii.buy, dii.sell, dii.net)}
      </div>
    </div>
  );
}
