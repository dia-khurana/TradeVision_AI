import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Signals from "@/pages/signals";
import Fno from "@/pages/fno";
import Portfolio from "@/pages/portfolio";
import Watchlist from "@/pages/watchlist";
import Bots from "@/pages/bots";
import BotDetail from "@/pages/bot-detail";
import News from "@/pages/news";
import Screener from "@/pages/screener";
import Crypto from "@/pages/crypto";
import UsStocks from "@/pages/us-stocks";
import MutualFunds from "@/pages/mutual-funds";
import Alerts from "@/pages/alerts";
import Chat from "@/pages/chat";
import Settings from "@/pages/settings";
import StockDetail from "@/pages/stock-detail";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppShell } from "@/components/AppShell";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 15_000, refetchOnWindowFocus: false } },
});

function inShell(C: React.ComponentType) {
  return (
    <ProtectedRoute>
      <AppShell>
        <C />
      </AppShell>
    </ProtectedRoute>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/dashboard">{inShell(Dashboard)}</Route>
      <Route path="/dashboard/signals">{inShell(Signals)}</Route>
      <Route path="/dashboard/fno">{inShell(Fno)}</Route>
      <Route path="/dashboard/portfolio">{inShell(Portfolio)}</Route>
      <Route path="/dashboard/watchlist">{inShell(Watchlist)}</Route>
      <Route path="/dashboard/bots">{inShell(Bots)}</Route>
      <Route path="/dashboard/bots/:id">{inShell(BotDetail)}</Route>
      <Route path="/dashboard/news">{inShell(News)}</Route>
      <Route path="/dashboard/screener">{inShell(Screener)}</Route>
      <Route path="/dashboard/crypto">{inShell(Crypto)}</Route>
      <Route path="/dashboard/us">{inShell(UsStocks)}</Route>
      <Route path="/dashboard/mf">{inShell(MutualFunds)}</Route>
      <Route path="/dashboard/alerts">{inShell(Alerts)}</Route>
      <Route path="/dashboard/chat">{inShell(Chat)}</Route>
      <Route path="/dashboard/settings">{inShell(Settings)}</Route>
      <Route path="/dashboard/stock/:symbol">{inShell(StockDetail)}</Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
