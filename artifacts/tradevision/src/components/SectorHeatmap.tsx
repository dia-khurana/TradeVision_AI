import { useMemo } from "react";
import { useRunScreener, getRunScreenerQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtPct } from "@/lib/format";

interface SectorBucket {
  sector: string;
  avgChangePct: number;
  count: number;
  topGainer?: { symbol: string; changePct: number };
  topLoser?: { symbol: string; changePct: number };
}

// Map % change to a tint. Strong green/red at extremes, near-neutral around 0.
function tint(pct: number): string {
  const clamp = Math.max(-3, Math.min(3, pct));
  if (clamp >= 0) {
    const a = (clamp / 3) * 0.85 + 0.05;
    return `rgba(16, 185, 129, ${a.toFixed(3)})`;
  }
  const a = (-clamp / 3) * 0.85 + 0.05;
  return `rgba(239, 68, 68, ${a.toFixed(3)})`;
}

export function SectorHeatmap() {
  const { data, isLoading } = useRunScreener(
    {},
    { query: { queryKey: getRunScreenerQueryKey({}), refetchInterval: 60_000 } },
  );

  const buckets = useMemo<SectorBucket[]>(() => {
    const map = new Map<string, { sum: number; count: number; rows: { symbol: string; changePct: number }[] }>();
    for (const r of data?.rows ?? []) {
      const cur = map.get(r.sector) ?? { sum: 0, count: 0, rows: [] };
      cur.sum += r.changePct;
      cur.count += 1;
      cur.rows.push({ symbol: r.symbol, changePct: r.changePct });
      map.set(r.sector, cur);
    }
    const out: SectorBucket[] = [];
    for (const [sector, v] of map.entries()) {
      const sorted = [...v.rows].sort((a, b) => b.changePct - a.changePct);
      out.push({
        sector,
        avgChangePct: v.sum / v.count,
        count: v.count,
        topGainer: sorted[0],
        topLoser: sorted[sorted.length - 1],
      });
    }
    return out.sort((a, b) => b.avgChangePct - a.avgChangePct);
  }, [data]);

  return (
    <div className="premium-card p-4" data-testid="sector-heatmap">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-extrabold tracking-tight flex items-center gap-2">
          <Layers className="h-4 w-4 text-indigo-500" /> Sector Heatmap
        </h3>
        <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
          Avg % · Today
        </span>
      </div>
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="h-[78px] rounded-xl" />
          ))}
        </div>
      ) : buckets.length === 0 ? (
        <div className="text-xs text-muted-foreground text-center py-6">No sector data yet.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {buckets.map((b) => {
            const up = b.avgChangePct >= 0;
            return (
              <div
                key={b.sector}
                data-testid={`sector-${b.sector}`}
                className="rounded-xl p-3 border border-white/60 relative overflow-hidden"
                style={{ background: tint(b.avgChangePct) }}
                title={`${b.sector}: ${b.count} stock${b.count === 1 ? "" : "s"}`}
              >
                <div className="font-extrabold text-xs uppercase tracking-wider text-slate-800">
                  {b.sector}
                </div>
                <div
                  className={cn(
                    "font-mono font-extrabold text-lg mt-1",
                    up ? "text-emerald-800" : "text-rose-800",
                  )}
                >
                  {fmtPct(b.avgChangePct)}
                </div>
                <div className="text-[10px] mt-1 text-slate-700/80 font-medium space-y-0.5">
                  {b.topGainer && (
                    <div>↑ <span className="font-bold">{b.topGainer.symbol}</span> {fmtPct(b.topGainer.changePct)}</div>
                  )}
                  {b.topLoser && b.topLoser.symbol !== b.topGainer?.symbol && (
                    <div>↓ <span className="font-bold">{b.topLoser.symbol}</span> {fmtPct(b.topLoser.changePct)}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
