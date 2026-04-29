import { Card, CardContent } from "@/components/ui/card";
import { IndexQuote } from "@workspace/api-client-react";
import { PriceChange } from "./PriceChange";
import { Sparkline } from "./Sparkline";

interface IndexCardProps {
  quote: IndexQuote;
}

export function IndexCard({ quote }: IndexCardProps) {
  return (
    <Card className="overflow-hidden bg-card/50 backdrop-blur-sm border-border/50">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-semibold text-sm text-muted-foreground">{quote.name}</h3>
        </div>
        <div className="text-2xl font-bold tracking-tight">
          ₹{quote.price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <PriceChange change={quote.change} changePct={quote.changePct} className="text-sm mt-1" />
        <Sparkline data={quote.history} />
      </CardContent>
    </Card>
  );
}
