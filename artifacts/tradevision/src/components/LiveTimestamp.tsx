import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface LiveTimestampProps {
  updatedAt?: string | Date;
  label?: string;
  live?: boolean;
  className?: string;
}

function formatAgo(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function LiveTimestamp({
  updatedAt,
  label = "Updated",
  live = true,
  className,
}: LiveTimestampProps) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  const ts = updatedAt ? new Date(updatedAt).getTime() : Date.now();
  const ago = formatAgo(Date.now() - ts);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500",
        className,
      )}
      title={new Date(ts).toLocaleString("en-IN")}
    >
      {live && (
        <span className="relative inline-flex h-1.5 w-1.5">
          <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-70" />
          <span className="relative rounded-full h-1.5 w-1.5 bg-emerald-500" />
        </span>
      )}
      <span>
        {label} {ago}
      </span>
    </span>
  );
}
