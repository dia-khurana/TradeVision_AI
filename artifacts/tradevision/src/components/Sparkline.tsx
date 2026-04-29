import { useMemo } from "react";

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
}

export function Sparkline({ data, color, height = 40 }: SparklineProps) {
  const { path, area, isUp } = useMemo(() => {
    if (!data || data.length < 2) {
      return { path: "", area: "", isUp: true };
    }
    const w = 200;
    const h = height;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const step = w / (data.length - 1);
    const points = data.map((v, i) => {
      const x = i * step;
      const y = h - ((v - min) / range) * (h - 4) - 2;
      return [x, y] as const;
    });
    const path =
      "M " + points.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(" L ");
    const area =
      path + ` L ${w} ${h} L 0 ${h} Z`;
    const isUp = data[data.length - 1] >= data[0];
    return { path, area, isUp };
  }, [data, height]);

  if (!data || data.length === 0) return null;

  const stroke = color || (isUp ? "#10b981" : "#ef4444");
  const fill = isUp ? "rgba(16,185,129,0.18)" : "rgba(239,68,68,0.18)";

  return (
    <svg
      viewBox={`0 0 200 ${height}`}
      preserveAspectRatio="none"
      className="w-full"
      style={{ height }}
    >
      <defs>
        <linearGradient id={`sl-${isUp ? "u" : "d"}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fill} />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sl-${isUp ? "u" : "d"})`} />
      <path d={path} fill="none" stroke={stroke} strokeWidth={1.6} strokeLinejoin="round" />
    </svg>
  );
}
