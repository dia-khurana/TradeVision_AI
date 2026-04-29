import { Link, useLocation } from "wouter";
import { LayoutDashboard, Activity, TrendingUp, Briefcase, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatDrawer } from "./ChatDrawer";
import { useAuth } from "@/lib/auth";
import { Button } from "./ui/button";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [location] = useLocation();
  const { logout } = useAuth();

  const navItems = [
    { href: "/dashboard", label: "Home", icon: LayoutDashboard },
    { href: "/dashboard/signals", label: "Signals", icon: Activity },
    { href: "/dashboard/fno", label: "F&O", icon: TrendingUp },
    { href: "/dashboard/portfolio", label: "Portfolio", icon: Briefcase },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card">
        <div className="p-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl text-primary">
            <Activity className="h-6 w-6" />
            TradeVision AI
          </Link>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border">
           <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={logout}>
              Log out
           </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-[100dvh]">
        {/* Top Banner */}
        <div
          data-testid="demo-mode-banner"
          className="bg-amber-400 text-black border-b border-amber-500 px-4 py-2 text-center text-xs font-semibold"
        >
          Demo Mode — Real market data, read-only access. Connect your broker to trade live.
        </div>

        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg text-primary">
            <Activity className="h-5 w-5" />
            TradeVision AI
          </Link>
          <Button variant="ghost" size="icon" onClick={logout} className="h-8 w-8 text-muted-foreground">
             <LayoutDashboard className="h-5 w-5" />
          </Button>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6 pb-24 md:pb-6">
          {children}
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-card flex items-center justify-around px-2 pb-safe z-40">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center w-full py-3 text-[10px] font-medium transition-colors gap-1",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive ? "text-primary" : "opacity-70")} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div
        data-testid="chat-launcher"
        className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50"
      >
        <ChatDrawer />
      </div>
    </div>
  );
}
