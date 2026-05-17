import type { IndexQuote } from "@workspace/api-client-react";
import { PriceChange } from "./PriceChange";
import { Sparkline } from "./Sparkline";

interface IndexCardProps {
  quote: IndexQuote;
}

export function IndexCard({ quote }: IndexCardProps) {
  const isUp = quote.change >= 0;
  return (
    <div
      className="premium-card p-3 relative overflow-hidden"
      data-testid={`index-card-${quote.symbol}`}
    >
      <div
        className="absolute -top-12 -right-12 h-32 w-32 rounded-full blur-2xl opacity-50"
        style={{
          background: isUp
            ? "radial-gradient(circle, rgba(34,197,94,0.35), transparent 70%)"
            : "radial-gradient(circle, rgba(239,68,68,0.35), transparent 70%)",
        }}
      />
      <div className="flex justify-between items-start mb-1 relative">
        <div className="min-w-0">
          <h3 className="font-extrabold text-[11px] uppercase tracking-wider text-slate-700 truncate">
            {quote.name}
          </h3>
          <div className="text-[10px] text-slate-500 font-medium">{quote.symbol}</div>
        </div>
        <span
          className="relative inline-flex h-1.5 w-1.5 mt-1.5 shrink-0"
          title="Live"
          aria-label="Live"
        >
          <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-60" />
          <span className="relative rounded-full h-1.5 w-1.5 bg-emerald-500" />
        </span>
      </div>
      <div className="text-xl font-extrabold tracking-tight font-mono mt-1.5 text-slate-900">
        {quote.price.toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </div>
      <PriceChange
        change={quote.change}
        changePct={quote.changePct}
        className="text-xs mt-0.5 font-bold"
      />
      <Sparkline data={quote.history} />
    </div>
  );
}
