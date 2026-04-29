import { useParams, Link } from "wouter";
import {
  useGetBots,
  getGetBotsQueryKey,
  useGetBotTrades,
  getGetBotTradesQueryKey,
  useGetBotPerformance,
  getGetBotPerformanceQueryKey,
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  CartesianGrid,
} from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

export default function BotDetail() {
  const { id } = useParams();
  const botId = Number(id);

  const { data: bots } = useGetBots({
    query: { queryKey: getGetBotsQueryKey() },
  });
  const bot = bots?.bots.find((b) => b.id === botId);

  const { data: tradesData, isLoading: tLoading } = useGetBotTrades(botId, {
    query: { queryKey: getGetBotTradesQueryKey(botId), enabled: !!botId },
  });
  const { data: perfData, isLoading: pLoading } = useGetBotPerformance(botId, {
    query: { queryKey: getGetBotPerformanceQueryKey(botId), enabled: !!botId },
  });

  // Backend already returns cumulative pnl per point — equity = capital + cumulativePnl
  const equityPoints = useMemo(() => {
    const cap = bot?.capital ?? 0;
    return (perfData?.points ?? []).map((p) => ({
      date: p.date,
      equity: Number((cap + p.pnl).toFixed(2)),
    }));
  }, [perfData, bot]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <Link
        href="/dashboard/bots"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-indigo-600"
      >
        <ArrowLeft className="h-4 w-4" /> Back to bots
      </Link>

      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center shadow-md">
          <Bot className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            {bot?.name ?? "Bot"}
          </h1>
          <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground">
            {bot?.type} · {bot?.status}
          </p>
        </div>
      </div>

      <div className="premium-card p-5">
        <h3 className="font-extrabold tracking-tight mb-3">Equity Curve</h3>
        {pLoading ? (
          <Skeleton className="h-[260px] w-full rounded-xl" />
        ) : (
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={equityPoints}>
                <CartesianGrid stroke="#eef" strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} domain={["dataMin", "dataMax"]} />
                <RTooltip
                  contentStyle={{
                    background: "white",
                    border: "1px solid #c7d2fe",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => `₹${v.toFixed(0)}`}
                />
                <Line type="monotone" dataKey="equity" stroke="#6366F1" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="premium-card overflow-hidden">
        <div className="px-4 py-3 border-b border-indigo-100">
          <h3 className="font-extrabold tracking-tight">Trades</h3>
        </div>
        {tLoading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-indigo-100">
                <TableHead>Time</TableHead>
                <TableHead>Symbol</TableHead>
                <TableHead>Action</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">P&L</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(tradesData?.trades ?? []).map((t) => (
                <TableRow key={t.id} className="border-indigo-50 hover:bg-indigo-50/40">
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(t.executedAt).toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell className="font-bold">{t.symbol}</TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "text-[10px] uppercase font-extrabold px-2 py-0.5 rounded",
                        t.action === "BUY"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-rose-100 text-rose-700",
                      )}
                    >
                      {t.action}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono">{t.qty}</TableCell>
                  <TableCell className="text-right font-mono">₹{t.price.toFixed(2)}</TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-mono font-bold",
                      t.pnl >= 0 ? "text-emerald-600" : "text-rose-600",
                    )}
                  >
                    {t.pnl >= 0 ? "+" : ""}₹{t.pnl.toFixed(0)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
