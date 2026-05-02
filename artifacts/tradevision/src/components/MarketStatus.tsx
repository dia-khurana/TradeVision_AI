import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// NSE/BSE: Mon–Fri, Pre-open 09:00–09:15 IST, Live 09:15–15:30 IST.
// We compute "now in IST" by reading the en-IN time zone parts via Intl.

interface ISTNow {
  day: number; // 0 = Sun
  hour: number;
  minute: number;
  second: number;
}

// Module-scoped formatter — re-instantiating it every tick is wasteful.
const IST_FMT = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Kolkata",
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

function nowIST(): ISTNow {
  const parts = IST_FMT.formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const days: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    day: days[get("weekday")] ?? 0,
    hour: parseInt(get("hour"), 10) || 0,
    minute: parseInt(get("minute"), 10) || 0,
    second: parseInt(get("second"), 10) || 0,
  };
}

type Phase = "PRE_OPEN" | "LIVE" | "CLOSED";

function classify(t: ISTNow): { phase: Phase; nextLabel: string; nextSeconds: number } {
  const mins = t.hour * 60 + t.minute;
  const isWeekend = t.day === 0 || t.day === 6;

  // Helper: seconds remaining until target HH:MM today
  const secsUntil = (h: number, m: number) =>
    (h * 3600 + m * 60) - (t.hour * 3600 + t.minute * 60 + t.second);

  if (!isWeekend && mins >= 9 * 60 && mins < 9 * 60 + 15) {
    return { phase: "PRE_OPEN", nextLabel: "Opens in", nextSeconds: secsUntil(9, 15) };
  }
  if (!isWeekend && mins >= 9 * 60 + 15 && mins < 15 * 60 + 30) {
    return { phase: "LIVE", nextLabel: "Closes in", nextSeconds: secsUntil(15, 30) };
  }
  // Closed → compute seconds until next pre-open at 09:00 IST
  let daysAhead = 0;
  let nextDay = t.day;
  // If after 15:30 today, next session is tomorrow (or Monday if weekend)
  for (let i = 0; i < 7; i++) {
    daysAhead = i === 0 && mins < 9 * 60 ? 0 : i + (mins >= 9 * 60 ? 1 : 0);
    nextDay = (t.day + daysAhead) % 7;
    if (nextDay !== 0 && nextDay !== 6) break;
  }
  const totalSecsToday = 24 * 3600 - (t.hour * 3600 + t.minute * 60 + t.second);
  const nextSeconds =
    daysAhead === 0
      ? secsUntil(9, 0)
      : totalSecsToday + (daysAhead - 1) * 24 * 3600 + 9 * 3600;
  return { phase: "CLOSED", nextLabel: "Opens in", nextSeconds };
}

function fmtCountdown(secs: number): string {
  if (secs <= 0) return "now";
  const d = Math.floor(secs / 86400);
  const h = Math.floor((secs % 86400) / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}m`;
  if (m > 0) return `${m}m ${s.toString().padStart(2, "0")}s`;
  return `${s}s`;
}

export function MarketStatus({ compact = false }: { compact?: boolean }) {
  const [t, setT] = useState<ISTNow>(() => nowIST());
  useEffect(() => {
    const id = window.setInterval(() => setT(nowIST()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const info = classify(t);
  const istClock =
    `${t.hour.toString().padStart(2, "0")}:${t.minute.toString().padStart(2, "0")}` +
    (compact ? "" : `:${t.second.toString().padStart(2, "0")}`);

  const dot =
    info.phase === "LIVE"
      ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)] animate-pulse"
      : info.phase === "PRE_OPEN"
      ? "bg-amber-500 animate-pulse"
      : "bg-slate-400";

  const label =
    info.phase === "LIVE" ? "Market Live" : info.phase === "PRE_OPEN" ? "Pre-open" : "Market Closed";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold",
        info.phase === "LIVE"
          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
          : info.phase === "PRE_OPEN"
          ? "bg-amber-50 border-amber-200 text-amber-700"
          : "bg-slate-100 border-slate-200 text-slate-600",
      )}
      data-testid="market-status"
      title={`${label} · IST ${istClock}`}
    >
      <span className={cn("h-2 w-2 rounded-full", dot)} />
      <span>{label}</span>
      <span className="opacity-60">·</span>
      <span className="font-mono tabular-nums">IST {istClock}</span>
      <span className="opacity-60">·</span>
      <span className="font-medium opacity-80">
        {info.nextLabel} <span className="font-mono tabular-nums">{fmtCountdown(info.nextSeconds)}</span>
      </span>
    </div>
  );
}
