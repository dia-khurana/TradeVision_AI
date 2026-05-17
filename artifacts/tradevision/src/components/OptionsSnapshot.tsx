import { useMemo } from "react";
import type { OptionsChain } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { LiveTimestamp } from "./LiveTimestamp";
import { fmtCompact } from "@/lib/format";

interface OptionsSnapshotProps {
  data: OptionsChain;
}

export function OptionsSnapshot({ data }: OptionsSnapshotProps) {
  const { topCE, topPE, highestCE, highestPE } = useMemo(() => {
    const rows = data.rows ?? [];
    const ce = [...rows].sort((a, b) => b.ceOi - a.ceOi);
    const pe = [...rows].sort((a, b) => b.peOi - a.peOi);
    return {
      topCE: ce.slice(0, 4),
      topPE: pe.slice(0, 4),
      highestCE: ce[0],
      highestPE: pe[0],
    };
  }, [data]);

  const bias = (data.bias || "neutral").toLowerCase();
  const biasCls =
    bias === "bullish"
      ? "border-emerald-300 text-emerald-700 bg-emerald-50"
      : bias === "bearish"
      ? "border-rose-300 text-rose-700 bg-rose-50"
      : "border-slate-300 text-slate-700 bg-slate-50";

  return (
    <div className="premium-card h-full flex flex-col" data-testid="options-snapshot">
      <div className="px-4 py-3 border-b border-indigo-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="text-sm font-extrabold tracking-tight">
            {data.underlying} Options Snapshot
          </div>
          {data.stale && (
            <Badge
              variant="outline"
              className="text-[9px] border-indigo-200 text-indigo-700 bg-indigo-50 font-bold uppercase"
              title="Indicative chain — NSE feed unavailable, derived from live spot. May differ from real-time exchange data."
            >
              Indicative
            </Badge>
          )}
        </div>
        <Badge
          variant="outline"
          className={cn("text-[10px] uppercase font-extrabold", biasCls)}
        >
          {bias} bias
        </Badge>
      </div>

      <div className="p-3 flex-1 space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <Metric
            label="Spot"
            value={data.underlyingValue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
          />
          <Metric label="PCR" value={data.pcr.toFixed(2)} tone={pcrTone(data.pcr)} />
          <Metric
            label="Max Pain"
            value={data.maxPain.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <PillarCard
            label="Highest Call OI"
            sub="Resistance"
            strike={highestCE?.strike}
            oi={highestCE?.ceOi}
            tone="emerald"
          />
          <PillarCard
            label="Highest Put OI"
            sub="Support"
            strike={highestPE?.strike}
            oi={highestPE?.peOi}
            tone="rose"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <h5 className="text-[10px] uppercase font-extrabold text-emerald-700 mb-1.5 tracking-wider">
              Top Calls
            </h5>
            <div className="space-y-1">
              {topCE.map((s) => (
                <div
                  key={s.strike}
                  className="flex justify-between items-center text-[11px] px-2 py-1 rounded-lg bg-emerald-50/70 border border-emerald-100"
                >
                  <span className="font-mono font-bold">{s.strike}</span>
                  <span className="text-slate-700 tabular-nums font-mono">
                    {fmtCompact(s.ceOi)}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h5 className="text-[10px] uppercase font-extrabold text-rose-700 mb-1.5 tracking-wider">
              Top Puts
            </h5>
            <div className="space-y-1">
              {topPE.map((s) => (
                <div
                  key={s.strike}
                  className="flex justify-between items-center text-[11px] px-2 py-1 rounded-lg bg-rose-50/70 border border-rose-100"
                >
                  <span className="font-mono font-bold">{s.strike}</span>
                  <span className="text-slate-700 tabular-nums font-mono">
                    {fmtCompact(s.peOi)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-2 border-t border-indigo-50 flex items-center justify-between">
        <span className="text-[10px] text-slate-600 font-bold">
          Expiry: <span className="font-mono">{data.expiry || "—"}</span>
        </span>
        <LiveTimestamp updatedAt={data.updatedAt} />
      </div>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-indigo-100 bg-white/70 p-2.5">
      <div className="text-[10px] uppercase font-extrabold text-slate-600 tracking-wider">
        {label}
      </div>
      <div className={cn("text-base font-extrabold font-mono tracking-tight", tone ?? "text-slate-900")}>
        {value}
      </div>
    </div>
  );
}

function PillarCard({
  label,
  sub,
  strike,
  oi,
  tone,
}: {
  label: string;
  sub: string;
  strike?: number;
  oi?: number;
  tone: "emerald" | "rose";
}) {
  const cls =
    tone === "emerald"
      ? "border-emerald-200 bg-emerald-50/60"
      : "border-rose-200 bg-rose-50/60";
  const textCls = tone === "emerald" ? "text-emerald-800" : "text-rose-800";
  return (
    <div className={cn("rounded-xl border p-2.5", cls)}>
      <div className="text-[10px] uppercase font-extrabold tracking-wider text-slate-600">
        {label}
      </div>
      <div className={cn("font-mono font-extrabold text-base mt-0.5", textCls)}>
        {strike ? strike.toLocaleString("en-IN") : "—"}
      </div>
      <div className="text-[10px] text-slate-600 mt-0.5">
        {sub} · OI {oi ? fmtCompact(oi) : "—"}
      </div>
    </div>
  );
}

function pcrTone(pcr: number): string {
  if (pcr > 1.2) return "text-emerald-700";
  if (pcr < 0.8) return "text-rose-700";
  return "text-slate-900";
}
