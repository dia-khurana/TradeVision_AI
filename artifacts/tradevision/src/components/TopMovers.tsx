import { useMemo } from "react";
import { useRunScreener, getRunScreenerQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtINR, fmtPct } from "@/lib/format";

type Tab = "gainers" | "losers" | "active";

import { useState } from "react";

export function TopMovers() {
  const [tab, setTab] = useState<Tab>("gainers");
  const { data, isLoading } = useRunScreener(
    {},
    { query: { queryKey: getRunScreenerQueryKey({}), refetchInterval: 60_000 } },
  );

  const rows = useMemo(() => {
    const all = (data?.rows ?? []).slice();
    if (tab === "gainers") return all.sort((a, b) => b.changePct - a.changePct).slice(0, 6);
    if (tab === "losers") return all.sort((a, b) => a.changePct - b.changePct).slice(0, 6);
    return all.sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct)).slice(0, 6);
  }, [data, tab]);

  const tabs: { value: Tab; label: string; Icon: typeof TrendingUp }[] = [
    { value: "gainers", label: "Gainers", Icon: TrendingUp },
    { value: "losers", label: "Losers", Icon: TrendingDown },
    { value: "active", label: "Active", Icon: Activity },
  ];

  return (
    <div className="premium-card p-4" data-testid="top-movers">
      <div className="flex items-center justify-between mb-3 gap-2">
        <h3 className="text-sm font-extrabold tracking-tight">Top Movers · NSE</h3>
        <div className="inline-flex rounded-lg bg-indigo-50 border border-indigo-100 p-0.5">
          {tabs.map((t) => {
            const active = tab === t.value;
            return (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                data-testid={`movers-tab-${t.value}`}
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all",
                  active ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-indigo-600",
                )}
              >
                <t.Icon className="h-3 w-3" />
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {isLoading || !data ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-9 w-full rounded-lg" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="text-xs text-muted-foreground text-center py-6">No data yet.</div>
      ) : (
        <ul className="space-y-1">
          {rows.map((r) => {
            const up = r.changePct >= 0;
            return (
              <li key={r.symbol}>
                <Link
                  href={`/dashboard/stock/${encodeURIComponent(r.symbol)}`}
                  className="flex items-center justify-between rounded-lg px-2.5 py-1.5 hover:bg-indigo-50 transition-colors group"
                  data-testid={`mover-${r.symbol}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={cn(
                        "h-7 w-7 rounded-lg flex items-center justify-center text-[10px] font-extrabold",
                        up ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700",
                      )}
                    >
                      {up ? "▲" : "▼"}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-xs truncate">{r.symbol}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{r.sector}</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono text-xs font-bold">{fmtINR(r.price)}</div>
                    <div
                      className={cn(
                        "font-mono text-[10px] font-bold",
                        up ? "text-emerald-600" : "text-rose-600",
                      )}
                    >
                      {fmtPct(r.changePct)}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
