import { useState } from "react";
import {
  useSearchMutualFunds,
  getSearchMutualFundsQueryKey,
  useGetMutualFund,
  getGetMutualFundQueryKey,
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Search, PieChart } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function MutualFunds() {
  const [q, setQ] = useState("HDFC");
  const [code, setCode] = useState<string>("");

  const { data: searchData } = useSearchMutualFunds(
    { q },
    { query: { queryKey: getSearchMutualFundsQueryKey({ q }), enabled: q.length >= 3 } },
  );
  const { data: fundData, isLoading: fundLoading } = useGetMutualFund(code, {
    query: { queryKey: getGetMutualFundQueryKey(code), enabled: !!code },
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-2">
          <PieChart className="h-6 w-6 text-indigo-500" /> Mutual Funds
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Search Indian mutual funds · NAV history via mfapi.in
        </p>
      </div>

      <div className="premium-card p-4">
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by fund name (e.g. HDFC, Axis Bluechip)…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        {searchData?.results && searchData.results.length > 0 && (
          <div className="mt-3 max-h-72 overflow-auto divide-y divide-indigo-50">
            {searchData.results.slice(0, 12).map((r) => (
              <button
                key={r.schemeCode}
                onClick={() => setCode(r.schemeCode)}
                className="w-full text-left px-3 py-2 hover:bg-indigo-50 rounded-lg flex items-center justify-between gap-2"
              >
                <span className="text-sm font-medium truncate">{r.schemeName}</span>
                <span className="text-[10px] text-muted-foreground font-mono">{r.schemeCode}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {code && (
        <div className="premium-card p-5">
          {fundLoading || !fundData ? (
            <Skeleton className="h-[360px] w-full" />
          ) : (
            <>
              <div className="mb-3">
                <h3 className="font-extrabold tracking-tight">{fundData.schemeName}</h3>
                <p className="text-xs text-muted-foreground">
                  {fundData.fundHouse} · {fundData.category}
                </p>
                <div className="flex items-center gap-4 mt-2 flex-wrap">
                  <div>
                    <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Latest NAV</div>
                    <div className="font-extrabold font-mono text-xl">₹{fundData.currentNav.toFixed(4)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">1D</div>
                    <div className={`font-bold font-mono ${fundData.change1d >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      {fundData.change1d >= 0 ? "+" : ""}{fundData.change1d.toFixed(2)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">1M</div>
                    <div className={`font-bold font-mono ${fundData.change1m >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      {fundData.change1m >= 0 ? "+" : ""}{fundData.change1m.toFixed(2)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">1Y</div>
                    <div className={`font-bold font-mono ${fundData.change1y >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      {fundData.change1y >= 0 ? "+" : ""}{fundData.change1y.toFixed(2)}%
                    </div>
                  </div>
                </div>
              </div>
              <div className="h-[360px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={fundData.history}>
                    <CartesianGrid stroke="#eef" strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} domain={["auto", "auto"]} />
                    <RTooltip
                      contentStyle={{
                        background: "white",
                        border: "1px solid #c7d2fe",
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                      formatter={(v: number) => `₹${v.toFixed(4)}`}
                    />
                    <Line type="monotone" dataKey="nav" stroke="#6366F1" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
