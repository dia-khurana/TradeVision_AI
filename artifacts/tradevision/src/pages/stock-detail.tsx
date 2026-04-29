import { useState } from "react";
import { useParams, Link } from "wouter";
import {
  useGetQuote,
  getGetQuoteQueryKey,
  useGetHistory,
  getGetHistoryQueryKey,
  useAddToWatchlist,
  useGetWatchlist,
  getGetWatchlistQueryKey,
  useRemoveFromWatchlist,
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Star, CandlestickChart, BarChart3, LineChart as LineIcon, AreaChart as AreaIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { PriceChange } from "@/components/PriceChange";
import { TradingChart, type ChartType } from "@/components/TradingChart";
import { cn } from "@/lib/utils";

const RANGES = [
  { value: 30, label: "1M" },
  { value: 60, label: "3M" },
  { value: 120, label: "6M" },
  { value: 180, label: "All" },
];

const TYPES: { value: ChartType; label: string; Icon: typeof CandlestickChart }[] = [
  { value: "candles", label: "Candles", Icon: CandlestickChart },
  { value: "bars", label: "Bars", Icon: BarChart3 },
  { value: "line", label: "Line", Icon: LineIcon },
  { value: "area", label: "Area", Icon: AreaIcon },
];

export default function StockDetail() {
  const { symbol } = useParams();
  const sym = decodeURIComponent(symbol ?? "");
  const qc = useQueryClient();
  const [chartType, setChartType] = useState<ChartType>("candles");
  const [rangeDays, setRangeDays] = useState(120);

  const { data: quote, isLoading: qLoading } = useGetQuote(sym, {
    query: { queryKey: getGetQuoteQueryKey(sym), refetchInterval: 30_000, enabled: !!sym },
  });
  const { data: hist, isLoading: hLoading } = useGetHistory(sym, {
    query: { queryKey: getGetHistoryQueryKey(sym), enabled: !!sym },
  });
  const { data: wl } = useGetWatchlist({ query: { queryKey: getGetWatchlistQueryKey() } });
  const inWl = !!wl?.items.find((i) => i.symbol === sym);
  const add = useAddToWatchlist();
  const rem = useRemoveFromWatchlist();

  const allCandles = hist?.candles ?? [];
  const candles = allCandles.slice(-rangeDays);
  const last = candles[candles.length - 1];
  const first = candles[0];
  const periodChange = first && last ? last.close - first.open : 0;
  const periodChangePct = first && last ? (periodChange / first.open) * 100 : 0;
  const periodHigh = candles.length ? Math.max(...candles.map((c) => c.high)) : 0;
  const periodLow = candles.length ? Math.min(...candles.map((c) => c.low)) : 0;
  const avgVolume = candles.length
    ? Math.round(candles.reduce((s, c) => s + c.volume, 0) / candles.length)
    : 0;

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <Link
        href="/dashboard/watchlist"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-indigo-600"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      {/* Header: symbol + price + watchlist */}
      <div className="premium-card p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{sym}</h1>
          {qLoading || !quote ? (
            <Skeleton className="h-10 w-40 mt-2" />
          ) : (
            <div className="flex items-baseline gap-3 mt-1">
              <div className="text-3xl md:text-4xl font-extrabold font-mono tracking-tight">
                ₹{quote.price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
              <PriceChange change={quote.change} changePct={quote.changePct} className="text-base" />
            </div>
          )}
        </div>
        <Button
          variant={inWl ? "outline" : "default"}
          className={inWl ? "" : "bg-gradient-to-r from-indigo-500 to-purple-500"}
          onClick={() => {
            if (inWl)
              rem.mutate(
                { symbol: sym },
                { onSuccess: () => qc.invalidateQueries({ queryKey: getGetWatchlistQueryKey() }) },
              );
            else
              add.mutate(
                { data: { symbol: sym, assetType: "EQUITY" } },
                { onSuccess: () => qc.invalidateQueries({ queryKey: getGetWatchlistQueryKey() }) },
              );
          }}
        >
          <Star className="h-4 w-4 mr-1.5" />
          {inWl ? "Remove from Watchlist" : "Add to Watchlist"}
        </Button>
      </div>

      {/* OHLC stats strip */}
      {last && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 md:gap-3">
          <Stat label="Open" value={`₹${last.open.toFixed(2)}`} />
          <Stat label="High" value={`₹${last.high.toFixed(2)}`} valueClass="text-emerald-600" />
          <Stat label="Low" value={`₹${last.low.toFixed(2)}`} valueClass="text-rose-600" />
          <Stat label="Close" value={`₹${last.close.toFixed(2)}`} />
          <Stat label="Volume" value={fmtVol(last.volume)} />
          <Stat
            label={`${rangeDays}D Change`}
            value={`${periodChangePct >= 0 ? "+" : ""}${periodChangePct.toFixed(2)}%`}
            valueClass={periodChangePct >= 0 ? "text-emerald-600" : "text-rose-600"}
          />
        </div>
      )}

      {/* Chart card with type + range selectors */}
      <div className="premium-card p-4 md:p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <h3 className="font-extrabold tracking-tight text-lg">Price Chart</h3>
          <div className="flex flex-wrap items-center gap-2">
            {/* Type toggle */}
            <div className="inline-flex rounded-xl bg-indigo-50 border border-indigo-100 p-1">
              {TYPES.map((t) => {
                const active = chartType === t.value;
                return (
                  <button
                    key={t.value}
                    onClick={() => setChartType(t.value)}
                    data-testid={`chart-type-${t.value}`}
                    className={cn(
                      "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all",
                      active
                        ? "bg-white text-indigo-700 shadow-sm"
                        : "text-slate-500 hover:text-indigo-600",
                    )}
                  >
                    <t.Icon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{t.label}</span>
                  </button>
                );
              })}
            </div>
            {/* Range toggle */}
            <div className="inline-flex rounded-xl bg-indigo-50 border border-indigo-100 p-1">
              {RANGES.map((r) => {
                const active = rangeDays === r.value;
                return (
                  <button
                    key={r.value}
                    onClick={() => setRangeDays(r.value)}
                    data-testid={`chart-range-${r.label}`}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-bold transition-all",
                      active
                        ? "bg-white text-indigo-700 shadow-sm"
                        : "text-slate-500 hover:text-indigo-600",
                    )}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        {hLoading || !hist ? (
          <Skeleton className="h-[420px] w-full" />
        ) : candles.length === 0 ? (
          <div className="h-[420px] flex items-center justify-center text-sm text-muted-foreground">
            No price data available.
          </div>
        ) : (
          <TradingChart candles={candles} type={chartType} height={420} showVolume />
        )}
      </div>

      {/* Period summary */}
      {candles.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label={`${rangeDays}D High`} value={`₹${periodHigh.toFixed(2)}`} valueClass="text-emerald-600" />
          <Stat label={`${rangeDays}D Low`} value={`₹${periodLow.toFixed(2)}`} valueClass="text-rose-600" />
          <Stat label="Avg Volume" value={fmtVol(avgVolume)} />
          <Stat
            label={`${rangeDays}D P&L`}
            value={`${periodChange >= 0 ? "+" : ""}₹${periodChange.toFixed(2)}`}
            valueClass={periodChange >= 0 ? "text-emerald-600" : "text-rose-600"}
          />
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="premium-card px-3 py-2.5">
      <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className={cn("text-base md:text-lg font-extrabold font-mono tracking-tight mt-0.5", valueClass)}>
        {value}
      </div>
    </div>
  );
}

function fmtVol(n: number): string {
  if (n >= 1e7) return `${(n / 1e7).toFixed(2)}Cr`;
  if (n >= 1e5) return `${(n / 1e5).toFixed(2)}L`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(n);
}
