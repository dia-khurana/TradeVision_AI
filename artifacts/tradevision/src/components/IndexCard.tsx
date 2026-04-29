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
      className="premium-card p-4 relative overflow-hidden"
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
        <div>
          <h3 className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground">
            {quote.name}
          </h3>
          <div className="text-[10px] text-muted-foreground/70">{quote.symbol}</div>
        </div>
      </div>
      <div className="text-2xl font-extrabold tracking-tight font-mono mt-2">
        {quote.price.toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </div>
      <PriceChange
        change={quote.change}
        changePct={quote.changePct}
        className="text-xs mt-1 font-bold"
      />
      <Sparkline data={quote.history} />
    </div>
  );
}
