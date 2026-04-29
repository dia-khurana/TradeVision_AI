import { useState } from "react";
import { useGetSignals, getGetSignalsQueryKey } from "@workspace/api-client-react";
import { SignalsTable } from "@/components/SignalsTable";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export default function Signals() {
  const [actionFilter, setActionFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");

  const { data, isLoading } = useGetSignals({
    query: { queryKey: getGetSignalsQueryKey(), refetchInterval: 30000 }
  });

  const filteredSignals = data?.signals.filter(s => {
    if (actionFilter !== "All" && s.action !== actionFilter) return false;
    if (typeFilter !== "All" && s.type !== typeFilter) return false;
    return true;
  }) || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Trading Signals</h1>
          <p className="text-muted-foreground text-sm mt-1">Rule-based computed signals updated every 30 seconds.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[120px] bg-card">
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Actions</SelectItem>
              <SelectItem value="BUY">BUY</SelectItem>
              <SelectItem value="SELL">SELL</SelectItem>
              <SelectItem value="HOLD">HOLD</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[120px] bg-card">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Types</SelectItem>
              <SelectItem value="EQUITY">EQUITY</SelectItem>
              <SelectItem value="FNO">FNO</SelectItem>
              <SelectItem value="VIX">VIX</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-[500px] w-full rounded-xl bg-muted/50" />
      ) : (
        <SignalsTable signals={filteredSignals} />
      )}
    </div>
  );
}
