import { useState } from "react";
import {
  useRunScreener,
  getRunScreenerQueryKey,
  type RunScreenerParams,
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";

const PRESETS: { value: string; label: string; params: RunScreenerParams }[] = [
  { value: "all", label: "All", params: {} },
  { value: "rsi_oversold", label: "RSI < 30 (Oversold)", params: { maxRsi: 30 } },
  { value: "rsi_overbought", label: "RSI > 70 (Overbought)", params: { minRsi: 70 } },
  { value: "rsi_neutral", label: "RSI 40–60", params: { minRsi: 40, maxRsi: 60 } },
];

export default function Screener() {
  const [preset, setPreset] = useState("all");
  const params = PRESETS.find((p) => p.value === preset)?.params ?? {};
  const { data, isLoading } = useRunScreener(params, {
    query: {
      queryKey: getRunScreenerQueryKey(params),
      refetchInterval: 60_000,
    },
  });

  const sortedRows = [...(data?.rows ?? [])].sort((a, b) => b.changePct - a.changePct);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-2">
          <Filter className="h-6 w-6 text-indigo-500" /> Stock Screener
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Scan our 15 tracked NSE symbols by RSI / sector / signal
        </p>
      </div>

      <Tabs value={preset} onValueChange={setPreset}>
        <TabsList className="bg-white border border-indigo-100 flex-wrap h-auto">
          {PRESETS.map((p) => (
            <TabsTrigger key={p.value} value={p.value}>
              {p.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <Skeleton className="h-[400px] w-full rounded-2xl" />
      ) : (
        <div className="premium-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-indigo-100">
                <TableHead>Symbol</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Sector</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">% Change</TableHead>
                <TableHead className="text-right">RSI(14)</TableHead>
                <TableHead>Signal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRows.map((r) => (
                <TableRow key={r.symbol} className="border-indigo-50 hover:bg-indigo-50/40">
                  <TableCell className="font-extrabold">
                    <Link
                      href={`/dashboard/stock/${encodeURIComponent(r.symbol)}`}
                      className="hover:text-indigo-600"
                    >
                      {r.symbol}
                    </Link>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                    {r.name}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.sector}</TableCell>
                  <TableCell className="text-right font-mono">₹{r.price.toFixed(2)}</TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-mono font-bold",
                      r.changePct >= 0 ? "text-emerald-600" : "text-rose-600",
                    )}
                  >
                    {r.changePct >= 0 ? "+" : ""}
                    {r.changePct.toFixed(2)}%
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-mono font-bold",
                      r.rsi < 30 ? "text-emerald-600" : r.rsi > 70 ? "text-rose-600" : "",
                    )}
                  >
                    {r.rsi.toFixed(1)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] font-bold uppercase",
                        r.signal === "BUY" && "border-emerald-300 text-emerald-700 bg-emerald-50",
                        r.signal === "SELL" && "border-rose-300 text-rose-700 bg-rose-50",
                        r.signal === "HOLD" && "border-slate-300 text-slate-600 bg-slate-50",
                      )}
                    >
                      {r.signal}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {sortedRows.length === 0 && (
            <div className="p-10 text-center text-muted-foreground">No matches.</div>
          )}
        </div>
      )}
    </div>
  );
}
