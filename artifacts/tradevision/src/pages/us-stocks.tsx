import { Globe2 } from "lucide-react";
import { useState } from "react";
import {
  useGetUsHistory,
  getGetUsHistoryQueryKey,
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const US_TICKERS = ["AAPL", "MSFT", "GOOGL", "AMZN", "META", "NVDA", "TSLA", "NFLX"];

export default function UsStocks() {
  const [active, setActive] = useState("AAPL");
  const { data, isLoading } = useGetUsHistory(active, {
    query: { queryKey: getGetUsHistoryQueryKey(active) },
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-2">
          <Globe2 className="h-6 w-6 text-indigo-500" /> US Stocks
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Pre-curated US tech megacaps · Daily history via Yahoo
        </p>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
        {US_TICKERS.map((t) => (
          <button
            key={t}
            onClick={() => setActive(t)}
            className={`px-3 py-2 rounded-xl border font-extrabold text-sm transition-all ${
              active === t
                ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-transparent shadow-md shadow-indigo-500/30"
                : "bg-white border-indigo-100 hover:bg-indigo-50"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="premium-card p-5">
        <div className="flex items-end justify-between mb-3">
          <div>
            <h3 className="font-extrabold text-xl tracking-tight">{active}</h3>
            <p className="text-xs text-muted-foreground">Daily candles</p>
          </div>
        </div>
        {isLoading || !data ? (
          <Skeleton className="h-[360px] w-full" />
        ) : (
          <div className="h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.candles}>
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
                />
                <Line type="monotone" dataKey="close" stroke="#6366F1" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
