import {
  useGetPortfolio,
  getGetPortfolioQueryKey,
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
import { cn } from "@/lib/utils";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Briefcase } from "lucide-react";

const SECTOR_COLORS = ["#6366F1", "#8B5CF6", "#06B6D4", "#10B981", "#F59E0B", "#EF4444", "#EC4899", "#84CC16"];

export default function Portfolio() {
  const { data, isLoading } = useGetPortfolio({
    query: { queryKey: getGetPortfolioQueryKey(), refetchInterval: 30_000 },
  });

  if (isLoading) return <Skeleton className="h-[600px] w-full rounded-2xl" />;
  if (!data) return null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-2">
          <Briefcase className="h-6 w-6 text-indigo-500" /> Portfolio
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Live mark-to-market with sector allocation
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="premium-card p-5">
          <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Current Value</div>
          <div className="text-2xl font-extrabold font-mono tracking-tight mt-1">
            ₹{data.currentValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </div>
        </div>
        <div className="premium-card p-5">
          <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Invested</div>
          <div className="text-2xl font-extrabold font-mono tracking-tight mt-1">
            ₹{data.invested.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </div>
        </div>
        <div className="premium-card p-5">
          <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Total P&L</div>
          <div
            className={cn(
              "text-2xl font-extrabold font-mono tracking-tight mt-1",
              data.totalPnl >= 0 ? "text-emerald-600" : "text-rose-600",
            )}
          >
            {data.totalPnl >= 0 ? "+" : ""}₹{data.totalPnl.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </div>
          <div className={cn("text-xs font-bold mt-0.5", data.totalPnl >= 0 ? "text-emerald-600" : "text-rose-600")}>
            ({data.totalPnlPct.toFixed(2)}%)
          </div>
        </div>
        <div className="premium-card p-5">
          <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Day P&L</div>
          <div
            className={cn(
              "text-2xl font-extrabold font-mono tracking-tight mt-1",
              data.dayPnl >= 0 ? "text-emerald-600" : "text-rose-600",
            )}
          >
            {data.dayPnl >= 0 ? "+" : ""}₹{data.dayPnl.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 premium-card overflow-hidden">
          <div className="px-4 py-3 border-b border-indigo-100">
            <h3 className="font-extrabold tracking-tight">Holdings</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-indigo-100">
                <TableHead>Symbol</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Avg</TableHead>
                <TableHead className="text-right">LTP</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead className="text-right">P&L</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.map((r) => (
                <TableRow key={r.symbol} className="border-indigo-50 hover:bg-indigo-50/40">
                  <TableCell className="font-extrabold">{r.symbol}</TableCell>
                  <TableCell className="text-right font-mono">{r.qty}</TableCell>
                  <TableCell className="text-right font-mono">₹{r.avgPrice.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-mono">₹{r.currentPrice.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-mono">
                    ₹{r.currentValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-mono font-bold",
                      r.pnl >= 0 ? "text-emerald-600" : "text-rose-600",
                    )}
                  >
                    {r.pnl >= 0 ? "+" : ""}₹{r.pnl.toFixed(0)}
                    <span className="text-xs ml-1">({r.pnlPct.toFixed(1)}%)</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="premium-card p-4">
          <h3 className="font-extrabold tracking-tight mb-2">Sector Allocation</h3>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  dataKey="value"
                  data={data.sectorAllocation}
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                  nameKey="sector"
                >
                  {data.sectorAllocation.map((_, i) => (
                    <Cell key={i} fill={SECTOR_COLORS[i % SECTOR_COLORS.length]} />
                  ))}
                </Pie>
                <RTooltip
                  formatter={(v: number) => `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
                  contentStyle={{ background: "white", border: "1px solid #c7d2fe", borderRadius: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
