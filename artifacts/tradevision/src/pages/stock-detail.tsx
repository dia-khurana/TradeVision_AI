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
import { ArrowLeft, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { PriceChange } from "@/components/PriceChange";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function StockDetail() {
  const { symbol } = useParams();
  const sym = decodeURIComponent(symbol ?? "");
  const qc = useQueryClient();

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

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <Link
        href="/dashboard/watchlist"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-indigo-600"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <div className="premium-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">{sym}</h1>
          {qLoading || !quote ? (
            <Skeleton className="h-10 w-40 mt-2" />
          ) : (
            <>
              <div className="text-3xl font-extrabold font-mono tracking-tight mt-1">
                ₹{quote.price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
              <PriceChange change={quote.change} changePct={quote.changePct} className="mt-1" />
            </>
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

      <div className="premium-card p-5">
        <h3 className="font-extrabold tracking-tight mb-3">Price History</h3>
        {hLoading || !hist ? (
          <Skeleton className="h-[400px] w-full" />
        ) : (
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hist.candles}>
                <defs>
                  <linearGradient id="px" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366F1" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#eef" strokeDasharray="3 3" />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} domain={["auto", "auto"]} />
                <RTooltip
                  contentStyle={{
                    background: "white",
                    border: "1px solid #c7d2fe",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => `₹${v.toFixed(2)}`}
                />
                <Area
                  type="monotone"
                  dataKey="close"
                  stroke="#6366F1"
                  strokeWidth={2}
                  fill="url(#px)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
