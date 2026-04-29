import { useState, useMemo } from "react";
import {
  useGetOptionsChainFor,
  getGetOptionsChainForQueryKey,
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp } from "lucide-react";

export default function Fno() {
  const [underlying, setUnderlying] = useState<"NIFTY" | "BANKNIFTY">("NIFTY");
  const { data, isLoading } = useGetOptionsChainFor(underlying, {
    query: {
      queryKey: getGetOptionsChainForQueryKey(underlying),
      refetchInterval: 30_000,
    },
  });

  const { topCE, topPE } = useMemo(() => {
    const rows = data?.rows ?? [];
    return {
      topCE: [...rows].sort((a, b) => b.ceOi - a.ceOi).slice(0, 8),
      topPE: [...rows].sort((a, b) => b.peOi - a.peOi).slice(0, 8),
    };
  }, [data]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-indigo-500" /> F&O Options Chain
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Top OI strikes · PCR · Max Pain — refreshed every 30s
          </p>
        </div>
        <Tabs value={underlying} onValueChange={(v) => setUnderlying(v as "NIFTY" | "BANKNIFTY")}>
          <TabsList className="bg-white border border-indigo-100">
            <TabsTrigger value="NIFTY">NIFTY</TabsTrigger>
            <TabsTrigger value="BANKNIFTY">BANKNIFTY</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <Skeleton className="h-[600px] w-full rounded-2xl" />
      ) : data ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="premium-card p-5">
              <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Spot</div>
              <div className="text-2xl font-extrabold font-mono tracking-tight mt-1">
                {data.underlyingValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-muted-foreground mt-1">{data.underlying}</div>
            </div>
            <div className="premium-card p-5 relative overflow-hidden">
              <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">PCR</div>
              <div className="text-2xl font-extrabold font-mono tracking-tight mt-1">{data.pcr.toFixed(2)}</div>
              <Badge
                variant="outline"
                className={cn(
                  "absolute top-4 right-4 text-[10px] uppercase font-bold",
                  data.bias === "bullish"
                    ? "border-emerald-300 text-emerald-700 bg-emerald-50"
                    : data.bias === "bearish"
                    ? "border-rose-300 text-rose-700 bg-rose-50"
                    : "border-slate-300 text-slate-600 bg-slate-50",
                )}
              >
                {data.bias}
              </Badge>
            </div>
            <div className="premium-card p-5">
              <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Max Pain</div>
              <div className="text-2xl font-extrabold font-mono tracking-tight mt-1">{data.maxPain}</div>
            </div>
            <div className="premium-card p-5">
              <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">ATM Strike</div>
              <div className="text-2xl font-extrabold font-mono tracking-tight mt-1">{data.atm}</div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div className="premium-card overflow-hidden">
              <div className="bg-emerald-50 border-b border-emerald-100 px-4 py-3 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <h3 className="font-extrabold text-emerald-700">Call Strikes (CE)</h3>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-emerald-100">
                    <TableHead>Strike</TableHead>
                    <TableHead className="text-right">OI</TableHead>
                    <TableHead className="text-right">Chg OI</TableHead>
                    <TableHead className="text-right">LTP</TableHead>
                    <TableHead className="text-right">IV</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topCE.map((s) => (
                    <TableRow key={s.strike} className="border-emerald-50/60 hover:bg-emerald-50/40">
                      <TableCell className="font-mono font-extrabold">{s.strike}</TableCell>
                      <TableCell className="text-right font-mono">{s.ceOi.toLocaleString("en-IN")}</TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-mono",
                          s.ceChgOi >= 0 ? "text-emerald-600" : "text-rose-600",
                        )}
                      >
                        {s.ceChgOi.toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell className="text-right font-mono">{s.ceLtp.toFixed(1)}</TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        {s.ceIv.toFixed(1)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="premium-card overflow-hidden">
              <div className="bg-rose-50 border-b border-rose-100 px-4 py-3 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-rose-500" />
                <h3 className="font-extrabold text-rose-700">Put Strikes (PE)</h3>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-rose-100">
                    <TableHead>Strike</TableHead>
                    <TableHead className="text-right">OI</TableHead>
                    <TableHead className="text-right">Chg OI</TableHead>
                    <TableHead className="text-right">LTP</TableHead>
                    <TableHead className="text-right">IV</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topPE.map((s) => (
                    <TableRow key={s.strike} className="border-rose-50/60 hover:bg-rose-50/40">
                      <TableCell className="font-mono font-extrabold">{s.strike}</TableCell>
                      <TableCell className="text-right font-mono">{s.peOi.toLocaleString("en-IN")}</TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-mono",
                          s.peChgOi >= 0 ? "text-emerald-600" : "text-rose-600",
                        )}
                      >
                        {s.peChgOi.toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell className="text-right font-mono">{s.peLtp.toFixed(1)}</TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        {s.peIv.toFixed(1)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
