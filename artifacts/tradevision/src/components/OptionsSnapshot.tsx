import type { OptionsChain } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface OptionsSnapshotProps {
  data: OptionsChain;
}

export function OptionsSnapshot({ data }: OptionsSnapshotProps) {
  const topCE = [...(data.rows ?? [])].sort((a, b) => b.ceOi - a.ceOi).slice(0, 4);
  const topPE = [...(data.rows ?? [])].sort((a, b) => b.peOi - a.peOi).slice(0, 4);
  const noData = !data.rows?.length && data.pcr === 0;

  return (
    <div className="premium-card h-full flex flex-col">
      <div className="px-4 py-3 border-b border-indigo-100 flex items-center justify-between">
        <div className="text-sm font-bold tracking-tight">Options Chain · {data.underlying}</div>
        <Badge
          variant="outline"
          className={cn(
            "text-[10px] uppercase font-bold",
            data.bias === "bullish"
              ? "border-emerald-300 text-emerald-700 bg-emerald-50"
              : data.bias === "bearish"
              ? "border-rose-300 text-rose-700 bg-rose-50"
              : "border-slate-300 text-slate-600 bg-slate-50",
          )}
        >
          {data.bias} bias
        </Badge>
      </div>
      <div className="p-4 flex-1">
        {noData ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-6 text-muted-foreground">
            <div className="text-xs uppercase tracking-wider mb-1">F&amp;O Snapshot</div>
            <div className="text-sm">Waiting for NSE option-chain access — refreshes every 30s.</div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="rounded-xl border border-indigo-100 bg-white/60 p-3">
                <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Spot</div>
                <div className="text-lg font-extrabold font-mono tracking-tight">
                  {data.underlyingValue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="rounded-xl border border-indigo-100 bg-white/60 p-3">
                <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">PCR</div>
                <div className="text-lg font-extrabold font-mono tracking-tight">{data.pcr.toFixed(2)}</div>
              </div>
              <div className="rounded-xl border border-indigo-100 bg-white/60 p-3">
                <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Max Pain</div>
                <div className="text-lg font-extrabold font-mono tracking-tight">{data.maxPain}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <h5 className="text-[10px] uppercase font-bold text-emerald-700 mb-2 tracking-wider">Top Calls</h5>
                <div className="space-y-1">
                  {topCE.map((s) => (
                    <div
                      key={s.strike}
                      className="flex justify-between items-center text-xs px-2 py-1.5 rounded-lg bg-emerald-50/70 border border-emerald-100"
                    >
                      <span className="font-mono font-bold">{s.strike}</span>
                      <span className="text-muted-foreground tabular-nums">{s.ceOi.toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h5 className="text-[10px] uppercase font-bold text-rose-700 mb-2 tracking-wider">Top Puts</h5>
                <div className="space-y-1">
                  {topPE.map((s) => (
                    <div
                      key={s.strike}
                      className="flex justify-between items-center text-xs px-2 py-1.5 rounded-lg bg-rose-50/70 border border-rose-100"
                    >
                      <span className="font-mono font-bold">{s.strike}</span>
                      <span className="text-muted-foreground tabular-nums">{s.peOi.toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
