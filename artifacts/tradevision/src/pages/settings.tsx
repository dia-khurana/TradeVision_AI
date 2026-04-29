import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Settings as SettingsIcon, LogOut, ShieldCheck, Database, Cpu } from "lucide-react";

export default function Settings() {
  const { user, logout } = useAuth();

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-2">
          <SettingsIcon className="h-6 w-6 text-indigo-500" /> Settings
        </h1>
      </div>

      <div className="premium-card p-5 flex items-center gap-4">
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center text-xl font-extrabold shadow-lg">
          {user?.avatarInitials ?? user?.name?.charAt(0)?.toUpperCase() ?? "?"}
        </div>
        <div className="flex-1">
          <div className="font-extrabold text-lg">{user?.name}</div>
          <div className="text-sm text-muted-foreground">{user?.email}</div>
          <div className="text-[10px] uppercase tracking-widest text-indigo-600 font-bold mt-1">
            Plan: {user?.plan}
          </div>
        </div>
        <Button variant="outline" onClick={logout}>
          <LogOut className="mr-1.5 h-4 w-4" /> Log out
        </Button>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <div className="premium-card p-4">
          <div className="h-9 w-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div className="font-bold">Read-only Demo</div>
          <div className="text-xs text-muted-foreground">No real orders are placed.</div>
        </div>
        <div className="premium-card p-4">
          <div className="h-9 w-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-2">
            <Database className="h-4 w-4" />
          </div>
          <div className="font-bold">Live Market Data</div>
          <div className="text-xs text-muted-foreground">NSE/BSE quotes refresh every 30s.</div>
        </div>
        <div className="premium-card p-4">
          <div className="h-9 w-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-2">
            <Cpu className="h-4 w-4" />
          </div>
          <div className="font-bold">AI Powered</div>
          <div className="text-xs text-muted-foreground">Gemini 2.5 with vision.</div>
        </div>
      </div>

      <div className="premium-card p-5">
        <h3 className="font-extrabold mb-3">Disclaimers</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          TradeVision AI is for educational and demo purposes only. Nothing on this dashboard
          constitutes investment advice. Quotes are sourced from public APIs (Yahoo, NSE, CoinGecko,
          mfapi.in). FII/DII numbers are indicative. Always do your own research before trading.
        </p>
      </div>
    </div>
  );
}
