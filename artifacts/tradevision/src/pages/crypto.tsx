import {
  useGetCryptoPrices,
  getGetCryptoPricesQueryKey,
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Bitcoin } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Crypto() {
  const { data, isLoading } = useGetCryptoPrices({
    query: { queryKey: getGetCryptoPricesQueryKey(), refetchInterval: 60_000 },
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-2">
          <Bitcoin className="h-6 w-6 text-amber-500" /> Crypto Markets
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Top coins by market cap · Powered by CoinGecko
        </p>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-[140px] rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(data?.coins ?? []).map((c) => {
            const up = c.change24h >= 0;
            return (
              <div key={c.id} className="premium-card p-4 relative overflow-hidden">
                <div
                  className="absolute -top-12 -right-12 h-32 w-32 rounded-full blur-2xl opacity-50"
                  style={{
                    background: up
                      ? "radial-gradient(circle, rgba(16,185,129,0.3), transparent 70%)"
                      : "radial-gradient(circle, rgba(239,68,68,0.3), transparent 70%)",
                  }}
                />
                <div className="flex items-center gap-3 mb-2 relative">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-300 to-orange-500 text-white flex items-center justify-center font-extrabold">
                    {c.symbol.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-extrabold truncate">{c.name}</div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                      {c.symbol}
                    </div>
                  </div>
                </div>
                <div className="text-2xl font-extrabold font-mono tracking-tight">
                  ${c.priceUsd.toLocaleString("en-US", {
                    maximumFractionDigits: c.priceUsd < 1 ? 4 : 2,
                  })}
                </div>
                <div
                  className={cn(
                    "text-xs font-bold mt-0.5",
                    up ? "text-emerald-600" : "text-rose-600",
                  )}
                >
                  {up ? "+" : ""}
                  {c.change24h.toFixed(2)}% (24h)
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
