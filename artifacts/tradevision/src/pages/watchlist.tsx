import { useState } from "react";
import {
  useGetWatchlist,
  getGetWatchlistQueryKey,
  useAddToWatchlist,
  useRemoveFromWatchlist,
  useSearchSymbols,
  getSearchSymbolsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Star, X, Plus, Search } from "lucide-react";
import { PriceChange } from "@/components/PriceChange";
import { Link } from "wouter";

export default function Watchlist() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

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
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-2">
          <Star className="h-6 w-6 text-indigo-500" /> Watchlist
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Track your favourite NSE stocks live</p>
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
        <Skeleton className="h-[400px] w-full rounded-2xl" />
      ) : (data?.items ?? []).length === 0 ? (
        <div className="premium-card p-10 text-center text-muted-foreground">
          Your watchlist is empty. Search above to add symbols.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.items.map((it) => (
            <div key={it.symbol} className="premium-card p-4 group relative" data-testid={`wl-${it.symbol}`}>
              <button
                onClick={() => remMut.mutate({ symbol: it.symbol }, { onSuccess: refresh })}
                className="absolute top-2 right-2 h-7 w-7 rounded-lg bg-white border border-rose-100 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                title="Remove"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <Link href={`/dashboard/stock/${encodeURIComponent(it.symbol)}`} className="block">
                <div className="font-extrabold text-lg">{it.symbol}</div>
                <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                  {it.assetType}
                </div>
                <div className="text-2xl font-extrabold font-mono tracking-tight mt-2">
                  ₹{it.price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
                <PriceChange change={it.change} changePct={it.changePct} className="text-xs mt-0.5" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
