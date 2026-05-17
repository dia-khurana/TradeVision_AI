import {
  useGetMarketIndices,
  getGetMarketIndicesQueryKey,
  useGetSignals,
  getGetSignalsQueryKey,
  useGetFiiDii,
  getGetFiiDiiQueryKey,
  useGetOptionsChainFor,
  getGetOptionsChainForQueryKey,
  useGetAlerts,
  getGetAlertsQueryKey,
  useGetPortfolio,
  getGetPortfolioQueryKey,
} from "@workspace/api-client-react";
import { IndexCard } from "@/components/IndexCard";
import { SignalsTable } from "@/components/SignalsTable";
import { FiiDiiPanel } from "@/components/FiiDiiPanel";
import { OptionsSnapshot } from "@/components/OptionsSnapshot";
import { AlertsList } from "@/components/AlertsList";
import { TopMovers } from "@/components/TopMovers";
import { SectorHeatmap } from "@/components/SectorHeatmap";
import { AiMarketPulse } from "@/components/AiMarketPulse";
import { MarketMood } from "@/components/MarketMood";
import { LiveTimestamp } from "@/components/LiveTimestamp";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Briefcase, TrendingUp, ArrowRight, Activity } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { fmtCompact, fmtSignedINR, fmtPct } from "@/lib/format";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: indicesData, isLoading: indicesLoading } = useGetMarketIndices({
    query: { queryKey: getGetMarketIndicesQueryKey(), refetchInterval: 30_000 },
  });
  const { data: signalsData, isLoading: signalsLoading } = useGetSignals({
    query: { queryKey: getGetSignalsQueryKey(), refetchInterval: 30_000 },
  });
  const { data: fiiDiiData } = useGetFiiDii({
    query: { queryKey: getGetFiiDiiQueryKey(), refetchInterval: 60_000 },
  });
  const { data: optionsData } = useGetOptionsChainFor("NIFTY", {
    query: { queryKey: getGetOptionsChainForQueryKey("NIFTY"), refetchInterval: 30_000 },
  });
  const { data: alertsData } = useGetAlerts({
    query: { queryKey: getGetAlertsQueryKey(), refetchInterval: 60_000 },
  });
  const { data: portfolioData } = useGetPortfolio({
    query: { queryKey: getGetPortfolioQueryKey(), refetchInterval: 30_000 },
  });

  const totalValue = portfolioData?.currentValue ?? 0;
  const totalPL = portfolioData?.totalPnl ?? 0;
  const totalPLPct = portfolioData?.totalPnlPct ?? 0;

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Hey, <span className="gradient-text">{user?.name?.split(" ")[0] ?? "Trader"}</span> 👋
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-slate-600 text-sm">Live Indian markets dashboard</p>
            <LiveTimestamp updatedAt={indicesData?.updatedAt} />
          </div>
        </div>
        <div className="flex gap-3 items-center">
          <div className="premium-card px-4 py-2.5">
            <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Portfolio</div>
            <div className="font-extrabold text-lg font-mono" title={`₹${totalValue.toLocaleString("en-IN")}`}>
              {fmtCompact(totalValue, true)}
            </div>
          </div>
          <div className="premium-card px-4 py-2.5">
            <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">P&amp;L</div>
            <div
              className={`font-extrabold text-lg font-mono ${
                totalPL >= 0 ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {fmtSignedINR(totalPL)}
              <span className="text-xs ml-1">({fmtPct(totalPLPct)})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Indices */}
      {indicesLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-[120px] rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {indicesData?.indices.map((q) => (
            <IndexCard key={q.symbol} quote={q} />
          ))}
        </div>
      )}

      {/* AI Market Pulse — full width hero */}
      <AiMarketPulse />

      {/* Sector heatmap */}
      <SectorHeatmap />

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold tracking-tight flex items-center gap-2">
                <Activity className="h-5 w-5 text-indigo-500" /> Latest Signals
              </h2>
              <Link
                href="/dashboard/signals"
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {signalsLoading ? (
              <Skeleton className="h-[320px] w-full rounded-2xl" />
            ) : (
              <SignalsTable signals={(signalsData?.signals ?? []).slice(0, 6)} />
            )}
          </div>

          {fiiDiiData && (
            <div className="min-h-[260px]">
              <FiiDiiPanel data={fiiDiiData} />
            </div>
          )}

          {/* Quick links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { href: "/dashboard/portfolio", label: "Portfolio", icon: Briefcase, color: "from-indigo-500 to-purple-500" },
              { href: "/dashboard/fno", label: "Options", icon: TrendingUp, color: "from-emerald-500 to-cyan-500" },
              { href: "/dashboard/bots", label: "Bots", icon: Activity, color: "from-amber-500 to-rose-500" },
              { href: "/dashboard/chat", label: "AI Chat", icon: ArrowRight, color: "from-fuchsia-500 to-purple-500" },
            ].map((q) => {
              const Icon = q.icon;
              return (
                <Link key={q.href} href={q.href}>
                  <div className="premium-card p-3 cursor-pointer">
                    <div className={`h-8 w-8 rounded-xl bg-gradient-to-br ${q.color} text-white flex items-center justify-center shadow-md mb-2`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="font-bold text-sm">{q.label}</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Open</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <MarketMood />
          <TopMovers />
          {optionsData && <OptionsSnapshot data={optionsData} />}
          {alertsData && (
            <div className="min-h-[280px]">
              <AlertsList alerts={(alertsData.alerts ?? []).slice(0, 6)} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
