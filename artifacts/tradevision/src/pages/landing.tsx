import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Activity, ArrowRight, TrendingUp, Zap, BarChart3, Bot } from "lucide-react";
import { useGetMarketIndices, getGetMarketIndicesQueryKey } from "@workspace/api-client-react";
import { PriceChange } from "@/components/PriceChange";

function TickerBar() {
  const { data } = useGetMarketIndices({
    query: { queryKey: getGetMarketIndicesQueryKey(), refetchInterval: 30000 }
  });

  if (!data?.indices) return null;

  return (
    <div className="w-full bg-card border-b border-border/50 overflow-hidden py-2 hidden md:block">
      <div className="flex justify-center items-center gap-8">
        {data.indices.map(idx => (
          <div key={idx.symbol} className="flex items-center gap-3">
            <span className="text-xs font-bold text-muted-foreground">{idx.name}</span>
            <span className="text-sm font-mono font-bold tracking-tight">
              {idx.price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
            <PriceChange change={idx.change} changePct={idx.changePct} className="text-xs" iconSize={12} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground selection:bg-primary/30">
      <TickerBar />

      <header className="px-6 py-5 flex items-center justify-between sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/10">
        <div className="flex items-center gap-2 font-bold text-xl text-primary">
          <Activity className="h-6 w-6" />
          TradeVision AI
        </div>
        <Link href="/login">
          <Button variant="outline" className="font-semibold border-primary/20 hover:bg-primary/10">
            Sign In
          </Button>
        </Link>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="px-6 py-24 md:py-32 flex flex-col items-center text-center relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Live NSE Feed Active
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter max-w-4xl leading-[1.1] mb-6">
            Real-time NSE signals. <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-amber-300">
              Built for Indian markets.
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
            Professional-grade dashboard combining rule-based signals, FII/DII flows, options chain analysis, and AI insights in one dense, fast interface.
          </p>

          <Link href="/login">
            <Button size="lg" className="h-14 px-8 text-base font-bold group shadow-xl shadow-primary/20">
              Open dashboard
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>

          {/* Stats Strip */}
          <div className="mt-20 pt-10 border-t border-border/50 grid grid-cols-2 md:grid-cols-4 gap-8 w-full max-w-4xl">
            <div className="flex flex-col gap-1">
              <span className="text-3xl font-bold font-mono tracking-tight">5+</span>
              <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Symbols tracked</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-3xl font-bold font-mono tracking-tight">30s</span>
              <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Refresh rate</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-3xl font-bold font-mono tracking-tight">100%</span>
              <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Real NSE data</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-3xl font-bold font-mono tracking-tight">F&O</span>
              <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">PCR · FII · DII</span>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="px-6 py-24 bg-card/30 border-y border-border/50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight mb-4">Everything you need to trade</h2>
              <p className="text-muted-foreground">No fluff. Just the data that matters.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Zap, title: "Live Signals", desc: "Rule-based BUY/SELL/HOLD signals with entry, target, and stop-loss levels." },
                { icon: BarChart3, title: "Options Flow", desc: "Real-time PCR, Max Pain, and highest OI strikes for NIFTY." },
                { icon: TrendingUp, title: "FII/DII Tracker", desc: "Institutional flow analysis visualised as buy/sell bars." },
                { icon: Bot, title: "AI Assistant", desc: "Ask the AI about market context, biases, and active signals." }
              ].map((f, i) => {
                const Icon = f.icon;
                return (
                  <div key={i} className="bg-card border border-border/50 p-6 rounded-2xl hover:border-primary/50 transition-colors">
                    <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-4">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-bold mb-2">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* How it works & Demo */}
        <section className="px-6 py-24 max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-8">How it works</h2>
            <div className="space-y-8">
              {[
                { step: "01", title: "Pin the tab at 9:14am", desc: "Open the dashboard before market open. It auto-refreshes." },
                { step: "02", title: "Monitor the signals", desc: "Watch the Signals table and Alerts list for new setups." },
                { step: "03", title: "Verify with options data", desc: "Check PCR and FII/DII flows to confirm the trend." }
              ].map((s, i) => (
                <div key={i} className="flex gap-4">
                  <div className="font-mono text-primary font-bold">{s.step}</div>
                  <div>
                    <h4 className="font-bold mb-1">{s.title}</h4>
                    <p className="text-sm text-muted-foreground">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border p-8 rounded-3xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-2xl rounded-full" />
            <h3 className="text-xl font-bold mb-2 relative z-10">Try it right now</h3>
            <p className="text-sm text-muted-foreground mb-6 relative z-10">Use these demo credentials to explore the live dashboard (read-only).</p>
            
            <div className="space-y-4 mb-8 relative z-10">
              <div className="bg-background border border-border/50 p-3 rounded-lg flex justify-between items-center">
                <span className="text-xs text-muted-foreground font-semibold uppercase">Email</span>
                <span className="font-mono text-sm font-bold">demo@tradevision.in</span>
              </div>
              <div className="bg-background border border-border/50 p-3 rounded-lg flex justify-between items-center">
                <span className="text-xs text-muted-foreground font-semibold uppercase">Password</span>
                <span className="font-mono text-sm font-bold">TradeVision@2025</span>
              </div>
            </div>

            <Link href="/login">
              <Button className="w-full h-12 font-bold relative z-10">
                Go to Login
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="px-6 py-8 border-t border-border/30 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} TradeVision AI. For educational and demo purposes only. Not investment advice.</p>
      </footer>
    </div>
  );
}
