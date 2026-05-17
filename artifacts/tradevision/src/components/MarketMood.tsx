import { useMemo } from "react";
import {
  useGetMarketIndices,
  getGetMarketIndicesQueryKey,
  useRunScreener,
  getRunScreenerQueryKey,
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AiBadge } from "./AiBadge";
import { cn } from "@/lib/utils";
import { Compass } from "lucide-react";

type Mood = "Risk-On" | "Risk-Off" | "Trending" | "Choppy" | "Volatile";

function moodStyle(m: Mood) {
  if (m === "Risk-On") return "from-emerald-500 to-teal-500 text-emerald-50";
  if (m === "Risk-Off") return "from-rose-500 to-red-500 text-rose-50";
  if (m === "Trending") return "from-indigo-500 to-purple-500 text-indigo-50";
  if (m === "Volatile") return "from-amber-500 to-orange-500 text-amber-50";
  return "from-slate-400 to-slate-500 text-slate-50";
}

function ScoreBar({ label, value, tone }: { label: string; value: number; tone: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600">
          {label}
        </span>
        <span className="font-mono font-extrabold text-xs tabular-nums">{pct}</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={cn("h-full bg-gradient-to-r", tone)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function MarketMood() {
  const { data: idx } = useGetMarketIndices({
    query: { queryKey: getGetMarketIndicesQueryKey(), refetchInterval: 30_000 },
  });
  const { data: scr } = useRunScreener(
    {},
    { query: { queryKey: getRunScreenerQueryKey({}), refetchInterval: 60_000 } },
  );

  const m = useMemo(() => {
    if (!idx || !scr) return null;

    const nifty = idx.indices.find((i) => i.symbol === "NIFTY");
    const vix = idx.indices.find((i) => i.symbol === "VIX");

    // Breadth 0-100
    const total = scr.rows.length || 1;
    const up = scr.rows.filter((r) => r.changePct > 0).length;
    const breadth = Math.round((up / total) * 100);

    // Momentum 0-100: how big the average move is, biased by direction
    const avgMove = scr.rows.reduce((s, r) => s + r.changePct, 0) / total;
    const momentum = Math.max(0, Math.min(100, Math.round(50 + avgMove * 25)));

    // Volatility 0-100 from VIX (12 -> 0, 30 -> 100)
    const vixVal = vix?.price ?? 14;
    const volatility = Math.max(0, Math.min(100, Math.round(((vixVal - 12) / 18) * 100)));

    // Mood classification
    let mood: Mood = "Choppy";
    if (volatility >= 70) mood = "Volatile";
    else if (Math.abs(avgMove) > 0.7 && breadth > 65) mood = "Risk-On";
    else if (Math.abs(avgMove) > 0.7 && breadth < 35) mood = "Risk-Off";
    else if (Math.abs(nifty?.changePct ?? 0) > 0.4 && volatility < 50) mood = "Trending";

    return { mood, breadth, momentum, volatility, vixVal };
  }, [idx, scr]);

  if (!m) {
    return <Skeleton className="h-[200px] w-full rounded-2xl" />;
  }

  return (
    <div className="premium-card" data-testid="market-mood">
      <div className="px-4 py-3 border-b border-indigo-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Compass className="h-4 w-4 text-indigo-600" />
          <h3 className="text-sm font-extrabold tracking-tight">Market Mood</h3>
          <AiBadge />
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div
          className={cn(
            "rounded-xl px-3 py-2.5 bg-gradient-to-br shadow-sm",
            moodStyle(m.mood),
          )}
        >
          <div className="text-[10px] uppercase font-bold tracking-widest opacity-90">
            Today's mood
          </div>
          <div className="text-xl font-extrabold tracking-tight">{m.mood}</div>
        </div>
        <div className="space-y-2.5">
          <ScoreBar
            label="Breadth"
            value={m.breadth}
            tone="from-emerald-500 to-teal-500"
          />
          <ScoreBar
            label="Momentum"
            value={m.momentum}
            tone="from-indigo-500 to-purple-500"
          />
          <ScoreBar
            label="Volatility"
            value={m.volatility}
            tone="from-amber-500 to-orange-500"
          />
        </div>
      </div>
    </div>
  );
}
