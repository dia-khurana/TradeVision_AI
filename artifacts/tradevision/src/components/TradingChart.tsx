import { useEffect, useRef } from "react";
import {
  createChart,
  ColorType,
  CrosshairMode,
  CandlestickSeries,
  BarSeries,
  LineSeries,
  AreaSeries,
  HistogramSeries,
  type IChartApi,
  type ISeriesApi,
  type Time,
} from "lightweight-charts";

export type ChartType = "candles" | "bars" | "line" | "area";

export interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface TradingChartProps {
  candles: Candle[];
  type?: ChartType;
  height?: number;
  showVolume?: boolean;
}

const UP = "#10B981";
const DOWN = "#EF4444";
const INDIGO = "#6366F1";

export function TradingChart({
  candles,
  type = "candles",
  height = 420,
  showVolume = true,
}: TradingChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const priceSeriesRef = useRef<ISeriesApi<any> | null>(null);
  const volSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const hasFittedRef = useRef(false);

  // Create / recreate chart when type or showVolume changes (each series type needs different setup)
  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;

    const chart = createChart(el, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#475569",
        fontFamily: "Inter, ui-sans-serif, system-ui",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "rgba(99,102,241,0.08)" },
        horzLines: { color: "rgba(99,102,241,0.08)" },
      },
      rightPriceScale: {
        borderColor: "rgba(99,102,241,0.15)",
        scaleMargins: { top: 0.08, bottom: showVolume ? 0.28 : 0.06 },
      },
      timeScale: {
        borderColor: "rgba(99,102,241,0.15)",
        timeVisible: false,
        secondsVisible: false,
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: "#6366F1", width: 1, style: 2, labelBackgroundColor: "#6366F1" },
        horzLine: { color: "#6366F1", width: 1, style: 2, labelBackgroundColor: "#6366F1" },
      },
      width: el.clientWidth,
      height,
      autoSize: false,
    });
    chartRef.current = chart;

    if (type === "candles") {
      priceSeriesRef.current = chart.addSeries(CandlestickSeries, {
        upColor: UP,
        downColor: DOWN,
        borderUpColor: UP,
        borderDownColor: DOWN,
        wickUpColor: UP,
        wickDownColor: DOWN,
      });
    } else if (type === "bars") {
      priceSeriesRef.current = chart.addSeries(BarSeries, {
        upColor: UP,
        downColor: DOWN,
        thinBars: false,
      });
    } else if (type === "line") {
      priceSeriesRef.current = chart.addSeries(LineSeries, {
        color: INDIGO,
        lineWidth: 2,
      });
    } else {
      priceSeriesRef.current = chart.addSeries(AreaSeries, {
        lineColor: INDIGO,
        topColor: "rgba(99,102,241,0.35)",
        bottomColor: "rgba(99,102,241,0.02)",
        lineWidth: 2,
      });
    }

    if (showVolume) {
      volSeriesRef.current = chart.addSeries(HistogramSeries, {
        color: "rgba(99,102,241,0.5)",
        priceFormat: { type: "volume" },
        priceScaleId: "vol",
      });
      chart.priceScale("vol").applyOptions({
        scaleMargins: { top: 0.78, bottom: 0 },
      });
    }

    const ro = new ResizeObserver(() => {
      if (!containerRef.current || !chartRef.current) return;
      chartRef.current.applyOptions({ width: containerRef.current.clientWidth, height });
    });
    ro.observe(el);

    hasFittedRef.current = false;

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      priceSeriesRef.current = null;
      volSeriesRef.current = null;
    };
  }, [type, height, showVolume]);

  // Push data when candles update
  useEffect(() => {
    if (!priceSeriesRef.current || !chartRef.current) return;
    const sorted = [...candles].sort((a, b) => (a.time < b.time ? -1 : 1));
    if (type === "candles" || type === "bars") {
      priceSeriesRef.current.setData(
        sorted.map((c) => ({
          time: c.time as Time,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        })),
      );
    } else {
      priceSeriesRef.current.setData(
        sorted.map((c) => ({ time: c.time as Time, value: c.close })),
      );
    }
    if (volSeriesRef.current) {
      volSeriesRef.current.setData(
        sorted.map((c) => ({
          time: c.time as Time,
          value: c.volume,
          color:
            c.close >= c.open ? "rgba(16,185,129,0.45)" : "rgba(239,68,68,0.45)",
        })),
      );
    }
    // Only fit on initial load after a recreate so user zoom/pan is preserved across data refreshes.
    if (!hasFittedRef.current && sorted.length > 0) {
      chartRef.current.timeScale().fitContent();
      hasFittedRef.current = true;
    }
  }, [candles, type]);

  return <div ref={containerRef} className="w-full" style={{ height }} />;
}

interface MiniCandlesProps {
  candles: Candle[];
  width?: number;
  height?: number;
}

// Tiny pure-SVG candle preview for cards (no chart instance overhead).
export function MiniCandles({ candles, width = 200, height = 48 }: MiniCandlesProps) {
  if (!candles || candles.length < 2) return null;
  const slice = candles.slice(-30);
  const lows = slice.map((c) => c.low);
  const highs = slice.map((c) => c.high);
  const min = Math.min(...lows);
  const max = Math.max(...highs);
  const range = max - min || 1;
  const padX = 1;
  const usableW = width - padX * 2;
  const stepX = usableW / slice.length;
  const bodyW = Math.max(1.5, stepX * 0.65);

  const y = (v: number) => height - ((v - min) / range) * (height - 4) - 2;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" width="100%" style={{ height }}>
      {slice.map((c, i) => {
        const cx = padX + i * stepX + stepX / 2;
        const yHi = y(c.high);
        const yLo = y(c.low);
        const yO = y(c.open);
        const yC = y(c.close);
        const up = c.close >= c.open;
        const color = up ? UP : DOWN;
        const top = Math.min(yO, yC);
        const bh = Math.max(1, Math.abs(yC - yO));
        return (
          <g key={i}>
            <line x1={cx} x2={cx} y1={yHi} y2={yLo} stroke={color} strokeWidth={0.8} />
            <rect x={cx - bodyW / 2} y={top} width={bodyW} height={bh} fill={color} />
          </g>
        );
      })}
    </svg>
  );
}
