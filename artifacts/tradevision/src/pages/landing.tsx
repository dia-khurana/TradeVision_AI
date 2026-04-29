import { useEffect, useRef } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  ArrowRight,
  TrendingUp,
  Zap,
  BarChart3,
  Bot,
  Globe2,
  Shield,
  CheckCircle2,
} from "lucide-react";
import {
  useGetMarketIndices,
  getGetMarketIndicesQueryKey,
} from "@workspace/api-client-react";
import { PriceChange } from "@/components/PriceChange";
import * as THREE from "three";

function ThreeHero() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Detect WebGL availability
    let renderer: THREE.WebGLRenderer;
    try {
      const test = document.createElement("canvas").getContext("webgl");
      if (!test) return;
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch {
      return;
    }

    const w = el.clientWidth;
    const h = el.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 100);
    camera.position.z = 6;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    el.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    // Floating glowing rings
    const ringGeo = new THREE.TorusGeometry(2, 0.04, 16, 200);
    const colors = [0x6366f1, 0x8b5cf6, 0x06b6d4];
    const rings: THREE.Mesh[] = [];
    for (let i = 0; i < 3; i++) {
      const m = new THREE.MeshBasicMaterial({
        color: colors[i],
        transparent: true,
        opacity: 0.55,
      });
      const r = new THREE.Mesh(ringGeo, m);
      r.rotation.x = Math.PI / 2 + (i * Math.PI) / 5;
      r.scale.setScalar(1 + i * 0.3);
      group.add(r);
      rings.push(r);
    }

    // Particle starfield
    const pCount = 600;
    const pGeo = new THREE.BufferGeometry();
    const pos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 14;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }
    pGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0x6366f1,
      size: 0.04,
      transparent: true,
      opacity: 0.7,
    });
    const points = new THREE.Points(pGeo, pMat);
    scene.add(points);

    // Floating cubes
    const cubes: THREE.Mesh[] = [];
    for (let i = 0; i < 6; i++) {
      const geo = new THREE.IcosahedronGeometry(0.18, 0);
      const mat = new THREE.MeshBasicMaterial({
        color: colors[i % 3],
        wireframe: true,
        transparent: true,
        opacity: 0.7,
      });
      const m = new THREE.Mesh(geo, mat);
      m.position.set(
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 4,
      );
      group.add(m);
      cubes.push(m);
    }

    let mx = 0;
    let my = 0;
    const onMove = (e: MouseEvent) => {
      mx = (e.clientX / window.innerWidth - 0.5) * 0.6;
      my = (e.clientY / window.innerHeight - 0.5) * 0.6;
    };
    window.addEventListener("mousemove", onMove);

    let raf = 0;
    let t = 0;
    const animate = () => {
      t += 0.005;
      group.rotation.y += 0.002 + mx * 0.002;
      group.rotation.x += 0.001 + my * 0.001;
      points.rotation.y += 0.0005;
      rings.forEach((r, i) => {
        r.rotation.z += 0.001 * (i + 1);
      });
      cubes.forEach((c, i) => {
        c.rotation.x += 0.01 + i * 0.001;
        c.rotation.y += 0.012;
        c.position.y += Math.sin(t + i) * 0.002;
      });
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => {
      if (!el) return;
      const W = el.clientWidth;
      const H = el.clientHeight;
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      renderer.setSize(W, H);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      ringGeo.dispose();
      pGeo.dispose();
      pMat.dispose();
      el.removeChild(renderer.domElement);
    };
  }, []);
  return (
    <div ref={ref} className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
      {/* CSS-only graceful fallback — visible immediately, replaced by canvas on success */}
      <div
        className="absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[900px] rounded-full opacity-60 blur-3xl"
        style={{
          background:
            "conic-gradient(from 0deg, rgba(99,102,241,0.4), rgba(139,92,246,0.4), rgba(6,182,212,0.4), rgba(99,102,241,0.4))",
        }}
      />
      <div
        className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(139,92,246,0.5), transparent 70%)" }}
      />
    </div>
  );
}

function TickerBar() {
  const { data } = useGetMarketIndices({
    query: { queryKey: getGetMarketIndicesQueryKey(), refetchInterval: 30_000 },
  });
  if (!data?.indices) return null;
  return (
    <div className="w-full glass-strong border-b border-white/40 overflow-hidden py-2 hidden md:block">
      <div className="flex justify-center items-center gap-10 text-xs">
        {data.indices.map((idx) => (
          <div key={idx.symbol} className="flex items-center gap-2.5">
            <span className="font-bold text-muted-foreground">{idx.name}</span>
            <span className="font-mono font-bold tracking-tight">
              {idx.price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
            <PriceChange change={idx.change} changePct={idx.changePct} className="text-[11px]" iconSize={11} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="min-h-[100dvh] flex flex-col text-foreground selection:bg-indigo-200">
      <TickerBar />

      <header className="px-6 py-4 flex items-center justify-between sticky top-0 z-50 glass-strong border-b border-white/40">
        <div className="flex items-center gap-2 font-extrabold text-lg">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
            <Sparkles className="h-5 w-5" />
          </div>
          <span>
            TradeVision <span className="gradient-text">AI</span>
          </span>
        </div>
        <Link href="/login">
          <Button className="font-bold bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 shadow-lg shadow-indigo-500/30">
            Sign in <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </Link>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative px-6 py-20 md:py-32 flex flex-col items-center text-center overflow-hidden">
          <ThreeHero />
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border border-indigo-200 text-indigo-700 text-[11px] font-extrabold uppercase tracking-widest mb-7">
            <span className="pulse-dot text-indigo-500"></span>
            Live NSE & BSE feed active
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter max-w-4xl leading-[1.05] mb-6">
            Indian markets. <br className="hidden md:block" />
            <span className="gradient-text">Beautifully decoded by AI.</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
            Real-time signals, FII/DII flows, options chain, AI-powered chart vision,
            and four trading bots — all in one premium dashboard.
          </p>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button
                size="lg"
                className="h-14 px-8 text-base font-bold bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 shadow-2xl shadow-indigo-500/40 group"
              >
                Open dashboard
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="h-14 px-8 text-base font-semibold border-indigo-200 bg-white/70 hover:bg-white">
                Try demo
              </Button>
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-4xl text-left">
            {[
              { v: "15+", l: "Symbols tracked" },
              { v: "30s", l: "Refresh rate" },
              { v: "4", l: "Trading bots" },
              { v: "F&O", l: "PCR · OI · Max Pain" },
            ].map((s) => (
              <div key={s.l} className="premium-card p-4">
                <div className="text-3xl font-extrabold gradient-text font-mono tracking-tight">{s.v}</div>
                <div className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="px-6 py-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
                Everything a serious Indian trader needs
              </h2>
              <p className="text-muted-foreground">No fluff. Just the data that matters.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { icon: Zap, title: "Live Signals", desc: "Rule-based BUY/SELL with entry, target, stop-loss, and confidence." },
                { icon: BarChart3, title: "Options Flow", desc: "Real-time PCR, Max Pain, OI for NIFTY & BANKNIFTY." },
                { icon: TrendingUp, title: "FII/DII Tracker", desc: "Institutional flows visualised as buy/sell bars." },
                { icon: Bot, title: "AI Vision Chat", desc: "Drop a chart screenshot — Gemini 2.5 reads it for you." },
                { icon: Sparkles, title: "4 Trading Bots", desc: "Momentum, Grid, DCA, Options Expiry — all with paper trades." },
                { icon: Globe2, title: "Global Coverage", desc: "Indian equities, US stocks, crypto, mutual funds." },
                { icon: Shield, title: "Read-only Demo", desc: "Real market data, zero broker risk. Connect a broker to go live." },
                { icon: CheckCircle2, title: "Beautifully fast", desc: "Premium light UI, 3D, glass, micro-interactions." },
              ].map((f, i) => {
                const Icon = f.icon;
                return (
                  <div key={i} className="premium-card p-5">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/30 mb-3">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-extrabold mb-1">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Demo creds */}
        <section className="px-6 py-20">
          <div className="max-w-3xl mx-auto premium-card p-8 md:p-10 text-center relative overflow-hidden">
            <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-indigo-500/15 blur-3xl" />
            <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-purple-500/15 blur-3xl" />
            <h2 className="text-2xl md:text-3xl font-extrabold mb-2 relative z-10">Try the live dashboard now</h2>
            <p className="text-muted-foreground mb-6 relative z-10">Use these read-only demo credentials.</p>
            <div className="grid sm:grid-cols-2 gap-3 mb-6 relative z-10">
              <div className="rounded-xl border border-indigo-100 bg-white/70 p-3 flex justify-between items-center">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Email</span>
                <span className="font-mono text-sm font-extrabold">demo@tradevision.in</span>
              </div>
              <div className="rounded-xl border border-indigo-100 bg-white/70 p-3 flex justify-between items-center">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Password</span>
                <span className="font-mono text-sm font-extrabold">TradeVision@2025</span>
              </div>
            </div>
            <Link href="/login">
              <Button className="h-12 px-8 font-bold bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 shadow-xl shadow-indigo-500/40 relative z-10">
                Go to login
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="px-6 py-8 border-t border-indigo-100 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} TradeVision AI · For educational and demo purposes only · Not investment advice
      </footer>
    </div>
  );
}
