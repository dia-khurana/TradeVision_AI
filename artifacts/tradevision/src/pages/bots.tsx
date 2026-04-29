import { useState } from "react";
import {
  useGetBots,
  getGetBotsQueryKey,
  useToggleBot,
  useCreateBot,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot, Plus, TrendingUp, Grid3x3, Wallet, Calendar, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

const STRATEGY_META: Record<
  string,
  { icon: any; gradient: string; label: string; desc: string }
> = {
  MOMENTUM: {
    icon: TrendingUp,
    gradient: "from-emerald-500 to-teal-500",
    label: "Momentum",
    desc: "Buy 5-day breakouts. Trend-following.",
  },
  GRID: {
    icon: Grid3x3,
    gradient: "from-indigo-500 to-purple-500",
    label: "Grid",
    desc: "Buy dips, sell rips inside a price range.",
  },
  DCA: {
    icon: Wallet,
    gradient: "from-amber-500 to-rose-500",
    label: "DCA",
    desc: "Dollar-cost average — buy fixed amount weekly.",
  },
  OPTIONS_EXPIRY: {
    icon: Calendar,
    gradient: "from-fuchsia-500 to-purple-500",
    label: "Options Expiry",
    desc: "Sell ATM straddle on expiry day theta plays.",
  },
};

function readSymbol(config: string): string {
  try {
    const o = JSON.parse(config || "{}");
    return o.symbol || "";
  } catch {
    return "";
  }
}

export default function Bots() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("My Bot");
  const [type, setType] = useState("MOMENTUM");
  const [symbol, setSymbol] = useState("RELIANCE");
  const [capital, setCapital] = useState(100000);

  const { data, isLoading } = useGetBots({
    query: { queryKey: getGetBotsQueryKey(), refetchInterval: 60_000 },
  });
  const toggleBot = useToggleBot();
  const createBot = useCreateBot();

  const refresh = () => qc.invalidateQueries({ queryKey: getGetBotsQueryKey() });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Bot className="h-6 w-6 text-indigo-500" /> Trading Bots
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Paper-traded automated strategies. View trades & equity curves.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-indigo-500 to-purple-500 font-bold shadow-lg shadow-indigo-500/30">
              <Plus className="mr-1.5 h-4 w-4" /> New Bot
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create new bot</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <div>
                <Label className="text-xs font-bold uppercase tracking-wider">Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs font-bold uppercase tracking-wider">Strategy</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STRATEGY_META).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-bold uppercase tracking-wider">Symbol</Label>
                <Input
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  placeholder="RELIANCE / NIFTY"
                />
              </div>
              <div>
                <Label className="text-xs font-bold uppercase tracking-wider">Capital ₹</Label>
                <Input
                  type="number"
                  value={capital}
                  onChange={(e) => setCapital(Number(e.target.value))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() =>
                  createBot.mutate(
                    {
                      data: {
                        name,
                        type,
                        capital,
                        config: JSON.stringify({ symbol }),
                      },
                    },
                    {
                      onSuccess: () => {
                        setOpen(false);
                        refresh();
                      },
                    },
                  )
                }
                className="bg-gradient-to-r from-indigo-500 to-purple-500 font-bold"
                disabled={createBot.isPending}
              >
                Create bot
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[180px] rounded-2xl" />
          ))}
        </div>
      ) : (data?.bots ?? []).length === 0 ? (
        <div className="premium-card p-10 text-center text-muted-foreground">
          No bots yet. Create your first one above.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {data?.bots.map((b) => {
            const meta = STRATEGY_META[b.type] ?? STRATEGY_META.MOMENTUM;
            const Icon = meta.icon;
            const isActive = b.status === "running";
            const upPL = b.pnl >= 0;
            const sym = readSymbol(b.config);
            return (
              <div key={b.id} className="premium-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3 min-w-0 flex-1">
                    <div
                      className={`h-12 w-12 shrink-0 rounded-2xl bg-gradient-to-br ${meta.gradient} text-white flex items-center justify-center shadow-md`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-extrabold tracking-tight truncate">{b.name}</div>
                      <div className="text-[11px] text-muted-foreground uppercase tracking-widest font-bold">
                        {meta.label}
                        {sym ? ` · ${sym}` : ""}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{meta.desc}</div>
                    </div>
                  </div>
                  <Switch
                    checked={isActive}
                    onCheckedChange={() => toggleBot.mutate({ id: b.id }, { onSuccess: refresh })}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4">
                  <div className="rounded-xl bg-indigo-50/60 border border-indigo-100 p-2.5">
                    <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                      Capital
                    </div>
                    <div className="font-extrabold font-mono text-sm">
                      ₹{b.capital.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                  <div className="rounded-xl bg-indigo-50/60 border border-indigo-100 p-2.5">
                    <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                      Trades
                    </div>
                    <div className="font-extrabold font-mono text-sm">{b.tradesCount}</div>
                  </div>
                  <div
                    className={cn(
                      "rounded-xl border p-2.5",
                      upPL
                        ? "bg-emerald-50/60 border-emerald-100"
                        : "bg-rose-50/60 border-rose-100",
                    )}
                  >
                    <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                      P&L
                    </div>
                    <div
                      className={cn(
                        "font-extrabold font-mono text-sm",
                        upPL ? "text-emerald-600" : "text-rose-600",
                      )}
                    >
                      {upPL ? "+" : ""}₹
                      {b.pnl.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span
                    className={cn(
                      "text-[10px] uppercase font-extrabold tracking-widest px-2 py-0.5 rounded-full",
                      isActive
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-500",
                    )}
                  >
                    {isActive ? "Active" : "Paused"}
                  </span>
                  <Link
                    href={`/dashboard/bots/${b.id}`}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
                  >
                    Details <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
