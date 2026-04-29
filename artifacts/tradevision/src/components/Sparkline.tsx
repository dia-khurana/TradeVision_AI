import { Line, LineChart, ResponsiveContainer, YAxis } from "recharts";
import { useMemo } from "react";

interface SparklineProps {
  data: number[];
  color?: string; // Optional override
}

export function Sparkline({ data, color }: SparklineProps) {
  const chartData = useMemo(() => data.map((value, i) => ({ value, index: i })), [data]);
  
  if (!data || data.length === 0) return null;

  const first = data[0];
  const last = data[data.length - 1];
  const isPositive = last >= first;
  
  const strokeColor = color || (isPositive ? "hsl(var(--success))" : "hsl(var(--destructive))");

  const min = Math.min(...data);
  const max = Math.max(...data);
  // Add some padding to domain so line doesn't touch the top/bottom exactly
  const padding = (max - min) * 0.1;

  return (
    <div className="h-10 w-full mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <YAxis domain={[min - padding, max + padding]} hide />
          <Line
            type="monotone"
            dataKey="value"
            stroke={strokeColor}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
