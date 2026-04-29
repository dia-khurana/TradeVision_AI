import { useState } from "react";
import {
  useGetSignals,
  getGetSignalsQueryKey,
  useGetFoSignals,
  getGetFoSignalsQueryKey,
} from "@workspace/api-client-react";
import { SignalsTable } from "@/components/SignalsTable";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity } from "lucide-react";

export default function Signals() {
  const [actionFilter, setActionFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [tab, setTab] = useState("equity");

  const eq = useGetSignals({
    query: { queryKey: getGetSignalsQueryKey(), refetchInterval: 30_000 },
  });
  const fo = useGetFoSignals({
    query: { queryKey: getGetFoSignalsQueryKey(), refetchInterval: 30_000, enabled: tab === "fo" },
  });

  const list = tab === "fo" ? fo.data?.signals ?? [] : eq.data?.signals ?? [];
  const isLoading = tab === "fo" ? fo.isLoading : eq.isLoading;

  const filtered = list.filter((s) => {
    if (actionFilter !== "All" && s.action !== actionFilter) return false;
    if (typeFilter !== "All" && s.type !== typeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Activity className="h-6 w-6 text-indigo-500" /> Trading Signals
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Rule-based BUY/SELL/HOLD signals with confidence — refreshed every 30s.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[120px] bg-white" data-testid="filter-action">
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All actions</SelectItem>
              <SelectItem value="BUY">BUY</SelectItem>
              <SelectItem value="SELL">SELL</SelectItem>
              <SelectItem value="HOLD">HOLD</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[120px] bg-white" data-testid="filter-type">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All types</SelectItem>
              <SelectItem value="EQUITY">Equity</SelectItem>
              <SelectItem value="FNO">F&amp;O</SelectItem>
              <SelectItem value="VIX">VIX</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-white border border-indigo-100">
          <TabsTrigger value="equity">Equity</TabsTrigger>
          <TabsTrigger value="fo">F&amp;O</TabsTrigger>
        </TabsList>
        <TabsContent value="equity" className="mt-4">
          {isLoading ? (
            <Skeleton className="h-[500px] w-full rounded-2xl" />
          ) : (
            <SignalsTable signals={filtered} />
          )}
        </TabsContent>
        <TabsContent value="fo" className="mt-4">
          {isLoading ? (
            <Skeleton className="h-[500px] w-full rounded-2xl" />
          ) : (
            <SignalsTable signals={filtered} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
