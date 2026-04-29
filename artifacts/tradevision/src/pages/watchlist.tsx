import { useState, useEffect, useRef } from "react";
import {
  useGetWatchlist,
  getGetWatchlistQueryKey,
  useAddToWatchlist,
  useRemoveFromWatchlist,
  useSearchSymbols,
  getSearchSymbolsQueryKey,
  useGetHistory,
  getGetHistoryQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Star, X, Plus, Search, CandlestickChart, LineChart as LineIcon, BarChart3, AreaChart as AreaIcon, ChevronRight } from "lucide-react";
import { PriceChange } from "@/components/PriceChange";
import { Link } from "wouter";
import { MiniCandles, type ChartType } from "@/components/TradingChart";
import { Sparkline } from "@/components/Sparkline";
import { cn } from "@/lib/utils";

const CHART_TYPES: { value: ChartType; label: string; Icon: typeof CandlestickChart }[] = [
  { value: "candles", label: "Candles", Icon: CandlestickChart },
  { value: "bars", label: "Bars", Icon: BarChart3 },
  { value: "line", label: "Line", Icon: LineIcon },
  { value: "area", label: "Area", Icon: AreaIcon },
];

const PREF_KEY = "tv:wl:chartType";

export default function Watchlist() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [chartType, setChartType] = useState<ChartType>(() => {
    if (typeof window === "undefined") return "candles";
    return ((localStorage.getItem(PREF_KEY) as ChartType) || "candles");
  });
  const setChart = (t: ChartType) => {
    setChartType(t);
    try { localStorage.setItem(PREF_KEY, t); } catch { /* ignore */ }
  };

  const { data, isLoading } = useGetWatchlist({
    query: { queryKey: getGetWatchlistQueryKey(), refetchInterval: 30_000 },
  });

  const addMut = useAddToWatchlist();
  const remMut = useRemoveFromWatchlist();

  const { data: searchData } = useSearchSymbols(
    { q: search },
    {
      query: {
        queryKey: getSearchSymbolsQueryKey({ q: search }),
        enabled: search.length >= 2,
      },
    },
  );

  const refresh = () => qc.invalidateQueries({ queryKey: getGetWatchlistQueryKey() });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Star className="h-6 w-6 text-indigo-500" /> Watchlist
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Track your favourite NSE stocks live</p>
        </div>
        <div className="inline-flex rounded-xl bg-white border border-indigo-100 p-1 self-start md:self-auto">
          {CHART_TYPES.map((t) => {
            const active = chartType === t.value;
            return (
              <button
                key={t.value}
                onClick={() => setChart(t.value)}
                data-testid={`wl-chart-type-${t.value}`}
                className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all",
                  active ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:text-indigo-600",
                )}
                title={t.label}
              >
                <t.Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="premium-card p-4">
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search NSE symbols (e.g. RELIANCE, INFY, TCS)…"
            value={search}
            onChange={(e) => setSearch(e.target.value.toUpperCase())}
            className="pl-9"
            data-testid="watchlist-search"
          />
        </div>
        {search.length >= 2 && searchData?.results && searchData.results.length > 0 && (
          <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {searchData.results.slice(0, 9).map((r) => (
              <button
                key={r.symbol}
                disabled={addMut.isPending}
                onClick={() =>
                  addMut.mutate(
                    { data: { symbol: r.symbol, assetType: r.type || "EQUITY" } },
                    {
                      onSuccess: () => {
                        setSearch("");
                        refresh();
                      },
                    },
                  )
                }
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-indigo-100 bg-white hover:bg-indigo-50 text-left"
              >
                <Plus className="h-4 w-4 text-indigo-500" />
                <div className="min-w-0">
                  <div className="font-bold text-sm truncate">{r.symbol}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{r.name}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[170px] w-full rounded-2xl" />
          ))}
        </div>
      ) : (data?.items ?? []).length === 0 ? (
        <div className="premium-card p-10 text-center text-muted-foreground">
          Your watchlist is empty. Search above to add symbols.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.items.map((it) => (
            <WatchlistCard
              key={it.symbol}
              symbol={it.symbol}
              assetType={it.assetType}
              price={it.price}
              change={it.change}
              changePct={it.changePct}
              chartType={chartType}
              onRemove={() => remMut.mutate({ symbol: it.symbol }, { onSuccess: refresh })}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface WatchlistCardProps {
  symbol: string;
  assetType: string;
  price: number;
  change: number;
  changePct: number;
  chartType: ChartType;
  onRemove: () => void;
}

function WatchlistCard({ symbol, assetType, price, change, changePct, chartType, onRemove }: WatchlistCardProps) {
  // Only fetch history once the card is in (or near) the viewport — keeps fanout small for long lists.
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (visible || !cardRef.current) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true);
            io.disconnect();
            break;
          }
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(cardRef.current);
    return () => io.disconnect();
  }, [visible]);

  const { data: hist } = useGetHistory(symbol, {
    query: { queryKey: getGetHistoryQueryKey(symbol), staleTime: 5 * 60_000, enabled: visible },
  });
  const candles = (hist?.candles ?? []).slice(-30);

  return (
    <div ref={cardRef} className="premium-card p-4 group relative" data-testid={`wl-${symbol}`}>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(); }}
        className="absolute top-2 right-2 h-7 w-7 rounded-lg bg-white border border-rose-100 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10"
        title="Remove"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      <Link href={`/dashboard/stock/${encodeURIComponent(symbol)}`} className="block">
        <div className="flex items-start justify-between">
          <div>
            <div className="font-extrabold text-lg flex items-center gap-1">
              {symbol}
              <ChevronRight className="h-3.5 w-3.5 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
              {assetType}
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-extrabold font-mono tracking-tight">
              ₹{price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <PriceChange change={change} changePct={changePct} className="text-[11px] mt-0.5 justify-end" />
          </div>
        </div>
        <div className="mt-3" data-testid={`wl-chart-${symbol}`}>
          {candles.length === 0 ? (
            <Skeleton className="h-[56px] w-full rounded" />
          ) : chartType === "candles" || chartType === "bars" ? (
            <MiniCandles candles={candles} height={56} />
          ) : (
            <Sparkline data={candles.map((c) => c.close)} height={56} />
          )}
        </div>
      </Link>
    </div>
  );
}
