import { useGetMarketIndices, getGetMarketIndicesQueryKey } from "@workspace/api-client-react";
import { IndexCard } from "@/components/IndexCard";
import { SignalsTable } from "@/components/SignalsTable";
import { useGetSignals, getGetSignalsQueryKey } from "@workspace/api-client-react";
import { FiiDiiPanel } from "@/components/FiiDiiPanel";
import { useGetFiiDii, getGetFiiDiiQueryKey } from "@workspace/api-client-react";
import { OptionsSnapshot } from "@/components/OptionsSnapshot";
import { useGetOptionsChain, getGetOptionsChainQueryKey } from "@workspace/api-client-react";
import { AlertsList } from "@/components/AlertsList";
import { useGetAlerts, getGetAlertsQueryKey } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: indicesData, isLoading: indicesLoading } = useGetMarketIndices({
    query: { queryKey: getGetMarketIndicesQueryKey(), refetchInterval: 30000 }
  });

  const { data: signalsData, isLoading: signalsLoading } = useGetSignals({
    query: { queryKey: getGetSignalsQueryKey(), refetchInterval: 30000 }
  });

  const { data: fiiDiiData, isLoading: fiiDiiLoading } = useGetFiiDii({
    query: { queryKey: getGetFiiDiiQueryKey(), refetchInterval: 30000 }
  });

  const { data: optionsData, isLoading: optionsLoading } = useGetOptionsChain({
    query: { queryKey: getGetOptionsChainQueryKey(), refetchInterval: 30000 }
  });

  const { data: alertsData, isLoading: alertsLoading } = useGetAlerts({
    query: { queryKey: getGetAlertsQueryKey(), refetchInterval: 30000 }
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Market Overview</h1>
        {indicesData?.stale && (
          <Badge variant="outline" className="text-amber-500 border-amber-500/50 bg-amber-500/10 gap-1.5 px-2.5 py-1">
            <AlertCircle className="h-3.5 w-3.5" />
            NSE data unavailable — last cached values
          </Badge>
        )}
      </div>

      {/* Indices Row */}
      {indicesLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-[120px] rounded-xl bg-muted/50" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {indicesData?.indices.map((quote) => (
            <div key={quote.symbol} className={quote.symbol === 'VIX' ? 'col-span-2 md:col-span-1' : ''}>
              <IndexCard quote={quote} />
            </div>
          ))}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Signals Table */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold tracking-tight">Latest Signals</h2>
            {signalsLoading ? (
              <Skeleton className="h-[300px] w-full rounded-xl bg-muted/50" />
            ) : (
              <SignalsTable signals={signalsData?.signals.slice(0, 5) || []} />
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* FII/DII */}
          <div className="h-[200px]">
            {fiiDiiLoading ? (
              <Skeleton className="h-full w-full rounded-xl bg-muted/50" />
            ) : fiiDiiData ? (
              <FiiDiiPanel data={fiiDiiData} />
            ) : null}
          </div>

          {/* Options Snapshot */}
          <div className="h-[280px]">
            {optionsLoading ? (
              <Skeleton className="h-full w-full rounded-xl bg-muted/50" />
            ) : optionsData ? (
              <OptionsSnapshot data={optionsData} />
            ) : null}
          </div>

          {/* Alerts */}
          <div className="h-[250px]">
            {alertsLoading ? (
              <Skeleton className="h-full w-full rounded-xl bg-muted/50" />
            ) : alertsData ? (
              <AlertsList alerts={alertsData.alerts.slice(0, 5)} />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
