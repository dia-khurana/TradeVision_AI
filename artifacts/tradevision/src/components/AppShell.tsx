import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Activity, TrendingUp, Briefcase, Bell, Star, Bot,
  Newspaper, Filter, Bitcoin, Globe2, PieChart, MessageSquare, Settings,
  LogOut, ChevronRight, Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { Button } from "./ui/button";
import { useGetAlerts, getGetAlertsQueryKey } from "@workspace/api-client-react";
import { MarketStatus } from "./MarketStatus";

interface AppShellProps {
  children: React.ReactNode;
}

const groups = [
  {
    label: "Markets",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/dashboard/signals", label: "Signals", icon: Activity },
      { href: "/dashboard/fno", label: "F&O Options", icon: TrendingUp },
      { href: "/dashboard/screener", label: "Screener", icon: Filter },
      { href: "/dashboard/news", label: "News", icon: Newspaper },
    ],
  },
  {
    label: "My Trading",
    items: [
      { href: "/dashboard/portfolio", label: "Portfolio", icon: Briefcase },
      { href: "/dashboard/watchlist", label: "Watchlist", icon: Star },
      { href: "/dashboard/bots", label: "Bots", icon: Bot },
      { href: "/dashboard/alerts", label: "Alerts", icon: Bell },
    ],
  },
  {
    label: "Global",
    items: [
      { href: "/dashboard/us", label: "US Stocks", icon: Globe2 },
      { href: "/dashboard/crypto", label: "Crypto", icon: Bitcoin },
      { href: "/dashboard/mf", label: "Mutual Funds", icon: PieChart },
    ],
  },
  {
    label: "AI",
    items: [
      { href: "/dashboard/chat", label: "AI Chat", icon: MessageSquare },
    ],
  },
];

export function AppShell({ children }: AppShellProps) {
  const [location] = useLocation();
  const { logout, user } = useAuth();
  const { data: alertData } = useGetAlerts({
    query: { queryKey: getGetAlertsQueryKey(), refetchInterval: 60_000 },
  });
  const unread = alertData?.alerts?.filter((a) => !a.isRead).length ?? 0;

  return (
    <div className="min-h-[100dvh] flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col glass-strong border-r border-white/40 sticky top-0 h-[100dvh]">
        <div className="px-5 py-5 flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="font-extrabold tracking-tight">TradeVision</div>
            <div className="text-[10px] uppercase tracking-widest text-indigo-500 font-bold">AI · Premium</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-5">
          {groups.map((g) => (
            <div key={g.label}>
              <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {g.label}
              </div>
              <div className="space-y-0.5">
                {g.items.map((it) => {
                  const Icon = it.icon;
                  const active =
                    location === it.href ||
                    (it.href !== "/dashboard" && location.startsWith(it.href));
                  return (
                    <Link
                      key={it.href}
                      href={it.href}
                      data-testid={`nav-${it.label.toLowerCase().replace(/\W+/g, "-")}`}
                      className={cn(
                        "group flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all",
                        active
                          ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md shadow-indigo-500/30"
                          : "text-foreground/70 hover:bg-white/60 hover:text-indigo-600"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1">{it.label}</span>
                      {it.href === "/dashboard/alerts" && unread > 0 && (
                        <span className="text-[10px] font-bold bg-rose-500 text-white px-1.5 py-0.5 rounded-full">
                          {unread}
                        </span>
                      )}
                      <ChevronRight className={cn("h-3 w-3 opacity-0 group-hover:opacity-100", active && "opacity-100")} />
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-3 py-3 border-t border-white/50 space-y-1">
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-foreground/70 hover:bg-white/60"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
          <div className="flex items-center gap-2 px-2 py-2">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center text-xs font-bold shadow">
              {user?.avatarInitials ?? user?.name?.charAt(0)?.toUpperCase() ?? "?"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">{user?.name ?? "Trader"}</div>
              <div className="text-[10px] uppercase tracking-widest text-indigo-500 font-bold">{user?.plan ?? "Demo"}</div>
            </div>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={logout} data-testid="logout-button" title="Log out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <div
          data-testid="demo-mode-banner"
          className="bg-gradient-to-r from-amber-100 via-yellow-100 to-amber-100 text-amber-900 border-b border-amber-200/60 px-4 py-1.5 flex items-center justify-center gap-3 text-[11px] font-semibold flex-wrap"
        >
          <span>Demo Mode · Live NSE/BSE quotes via Yahoo · Read-only</span>
          <span className="hidden md:inline opacity-50">|</span>
          <MarketStatus compact />
        </div>

        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 glass-strong border-b border-white/40">
          <Link href="/dashboard" className="flex items-center gap-2 font-extrabold">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center">
              <Sparkles className="h-4 w-4" />
            </div>
            TradeVision
          </Link>
          <Link href="/dashboard/alerts">
            <Button size="icon" variant="ghost" className="relative">
              <Bell className="h-5 w-5" />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 text-[9px] font-bold bg-rose-500 text-white px-1.5 py-0.5 rounded-full">
                  {unread}
                </span>
              )}
            </Button>
          </Link>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6 pb-24 lg:pb-8">{children}</main>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 glass-strong border-t border-white/40 flex items-center justify-around px-2 z-40 pb-safe">
          {[
            { href: "/dashboard", label: "Home", icon: LayoutDashboard },
            { href: "/dashboard/signals", label: "Signals", icon: Activity },
            { href: "/dashboard/portfolio", label: "Folio", icon: Briefcase },
            { href: "/dashboard/bots", label: "Bots", icon: Bot },
            { href: "/dashboard/chat", label: "AI", icon: MessageSquare },
          ].map((it) => {
            const Icon = it.icon;
            const active =
              location === it.href ||
              (it.href !== "/dashboard" && location.startsWith(it.href));
            return (
              <Link
                key={it.href}
                href={it.href}
                className={cn(
                  "flex flex-col items-center justify-center w-full py-2.5 text-[10px] font-medium gap-0.5 transition-colors",
                  active ? "text-indigo-600" : "text-muted-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5", active && "drop-shadow-md")} />
                {it.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
