import { useMemo } from "react";
import {
  useGetMarketIndices,
  getGetMarketIndicesQueryKey,
  useGetFiiDii,
  getGetFiiDiiQueryKey,
  useGetOptionsChainFor,
  getGetOptionsChainForQueryKey,
  useRunScreener,
  getRunScreenerQueryKey,
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AiBadge } from "./AiBadge";
import { LiveTimestamp } from "./LiveTimestamp";
import { cn } from "@/lib/utils";
import { Activity, TrendingUp, TrendingDown, Minus } from "lucide-react";

type Bias = "Bullish" | "Bearish" | "Neutral";

function biasStyle(b: Bias) {
  if (b === "Bullish")
    return { bg: "from-emerald-500 to-teal-500", text: "text-emerald-700", Icon: TrendingUp };
  if (b === "Bearish")
    return { bg: "from-rose-500 to-orange-500", text: "text-rose-700", Icon: TrendingDown };
  return { bg: "from-slate-400 to-slate-500", text: "text-slate-700", Icon: Minus };
}

export function AiMarketPulse() {
  const { data: idx } = useGetMarketIndices({
    query: { queryKey: getGetMarketIndicesQueryKey(), refetchInterval: 30_000 },
  });
  const { data: fii } = useGetFiiDii({
    query: { queryKey: getGetFiiDiiQueryKey(), refetchInterval: 60_000 },
  });
  const { data: opt } = useGetOptionsChainFor("NIFTY", {
    query: { queryKey: getGetOptionsChainForQueryKey("NIFTY"), refetchInterval: 30_000 },
  });
  const { data: scr } = useRunScreener(
    {},
    { query: { queryKey: getRunScreenerQueryKey({}), refetchInterval: 60_000 } },
  );

  const pulse = useMemo(() => {
    if (!idx || !scr) return null;

    const nifty = idx.indices.find((i) => i.symbol === "NIFTY");
    const bank = idx.indices.find((i) => i.symbol === "BANKNIFTY");
    const vix = idx.indices.find((i) => i.symbol === "VIX");

    // Breadth from screener: % of tracked stocks that are up
    const total = scr.rows.length || 1;
    const up = scr.rows.filter((r) => r.changePct > 0).length;
    const breadthPct = Math.round((up / total) * 100);

    // Sector strength
    const bySector = new Map<string, { sum: number; count: number }>();
    for (const r of scr.rows) {
      const cur = bySector.get(r.sector) ?? { sum: 0, count: 0 };
      cur.sum += r.changePct;
      cur.count += 1;
      bySector.set(r.sector, cur);
    }
    const sectorAgg = Array.from(bySector.entries())
      .map(([s, v]) => ({ sector: s, avg: v.sum / v.count }))
      .sort((a, b) => b.avg - a.avg);
    const strongest = sectorAgg[0];
    const weakest = sectorAgg[sectorAgg.length - 1];

    // Bias scoring: indices, breadth, FII, PCR
    let score = 0;
    if (nifty && nifty.changePct > 0.2) score += 2;
    else if (nifty && nifty.changePct < -0.2) score -= 2;
    if (bank && bank.changePct > 0.3) score += 1;
    else if (bank && bank.changePct < -0.3) score -= 1;
    if (breadthPct >= 60) score += 1;
    else if (breadthPct <= 40) score -= 1;
    if (fii && fii.fii.net > 0) score += 1;
    else if (fii && fii.fii.net < 0) score -= 1;
    if (opt && opt.pcr > 1.2) score += 1;
    else if (opt && opt.pcr < 0.8) score -= 1;

    const bias: Bias = score >= 2 ? "Bullish" : score <= -2 ? "Bearish" : "Neutral";

    // Volatility from VIX
    const vixVal = vix?.price ?? 14;
    const volStatus =
      vixVal < 12 ? "Low" : vixVal < 16 ? "Moderate" : vixVal < 20 ? "Elevated" : "High";

    // Confidence — how strongly indicators agree
    const maxScore = 6;
    const confidence = Math.round(50 + (Math.abs(score) / maxScore) * 45);

    const summary = (() => {
      const dir = bias === "Bullish" ? "positive" : bias === "Bearish" ? "negative" : "mixed";
      const sectorPart = strongest && weakest && strongest.sector !== weakest.sector
        ? ` led by ${strongest.sector}, while ${weakest.sector} drags.`
        : ".";
      const volPart =
        vixVal > 18
          ? " Volatility is elevated — avoid overleveraged trades."
          : vixVal < 13
          ? " Volatility is compressed — option sellers favoured."
          : " Volatility is moderate.";
      return `AI detects ${dir} market breadth (${breadthPct}% advancing)${sectorPart}${volPart}`;
    })();

    return {
      bias,
      strongest: strongest?.sector ?? "—",
      weakest: weakest?.sector ?? "—",
      volStatus,
      vixVal,
      breadthPct,
      confidence,
      summary,
    };
  }, [idx, scr, fii, opt]);

  if (!pulse) {
    return <Skeleton className="h-[170px] w-full rounded-2xl" />;
  }

  const s = biasStyle(pulse.bias);
  const Icon = s.Icon;

  return (
    <div
      className="premium-card relative overflow-hidden"
      data-testid="ai-market-pulse"
    >
      <div
        className="absolute -top-16 -right-16 h-44 w-44 rounded-full blur-3xl opacity-40"
        style={{
          background:
            pulse.bias === "Bullish"
              ? "radial-gradient(circle, rgba(16,185,129,0.5), transparent 70%)"
              : pulse.bias === "Bearish"
              ? "radial-gradient(circle, rgba(244,63,94,0.5), transparent 70%)"
              : "radial-gradient(circle, rgba(99,102,241,0.4), transparent 70%)",
        }}
      />

      <div className="px-4 py-3 border-b border-indigo-100 flex items-center justify-between relative">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-indigo-600" />
          <h3 className="text-sm font-extrabold tracking-tight">AI Market Pulse</h3>
          <AiBadge />
        </div>
        <LiveTimestamp updatedAt={idx?.updatedAt} />
      </div>

      <div className="p-4 grid grid-cols-2 lg:grid-cols-5 gap-3 relative">
        {/* Market Bias hero */}
        <div className="col-span-2 lg:col-span-2 rounded-xl border border-white/60 bg-white/70 p-3">
          <div className="text-[10px] uppercase font-bold text-slate-600 tracking-wider">
            Market Bias
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div
              className={cn(
                "h-9 w-9 rounded-xl bg-gradient-to-br text-white flex items-center justify-center shadow",
                s.bg,
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div className={cn("text-2xl font-extrabold tracking-tight", s.text)}>
              {pulse.bias}
            </div>
          </div>
          <div className="mt-2 text-[11px] text-slate-700">
            <span className="font-bold">AI Confidence</span>{" "}
            <span className="font-mono font-extrabold tabular-nums">{pulse.confidence}%</span>
            <span className="mx-2 text-slate-300">·</span>
            <span className="font-bold">Breadth</span>{" "}
            <span className="font-mono font-extrabold tabular-nums">{pulse.breadthPct}%</span>
          </div>
        </div>

        <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
          <div className="text-[10px] uppercase font-bold text-emerald-700/80 tracking-wider">
            Strongest
          </div>
          <div className="mt-1 font-extrabold text-sm text-emerald-800 truncate">
            {pulse.strongest}
          </div>
        </div>
        <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-3">
          <div className="text-[10px] uppercase font-bold text-rose-700/80 tracking-wider">
            Weakest
          </div>
          <div className="mt-1 font-extrabold text-sm text-rose-800 truncate">
            {pulse.weakest}
          </div>
        </div>
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3">
          <div className="text-[10px] uppercase font-bold text-indigo-700/80 tracking-wider">
            Volatility
          </div>
          <div className="mt-1 font-extrabold text-sm text-indigo-800">{pulse.volStatus}</div>
          <div className="text-[10px] text-indigo-600/80 font-mono">
            VIX {pulse.vixVal.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="px-4 pb-3 pt-1 text-xs text-slate-700 leading-relaxed border-t border-indigo-50">
        <span className="font-extrabold text-indigo-700">AI insight ·</span> {pulse.summary}
      </div>
    </div>
  );
}
