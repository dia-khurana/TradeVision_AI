import { FiiDiiResponse } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface FiiDiiPanelProps {
  data: FiiDiiResponse;
}

export function FiiDiiPanel({ data }: FiiDiiPanelProps) {
  const { fii, dii } = data;

  const maxVal = Math.max(
    Math.abs(fii.buy), Math.abs(fii.sell),
    Math.abs(dii.buy), Math.abs(dii.sell)
  );

  const calculatePct = (val: number) => {
    if (maxVal === 0) return 0;
    return (val / maxVal) * 100;
  };

  const renderBar = (buy: number, sell: number, net: number) => {
    const buyPct = calculatePct(buy);
    const sellPct = calculatePct(sell);
    
    return (
      <div className="space-y-3 mt-4">
        <div className="flex justify-between items-baseline">
          <span className="text-sm text-muted-foreground">Net Flow</span>
          <span className={cn(
            "font-bold font-mono",
            net >= 0 ? "text-success" : "text-destructive"
          )}>
            {net >= 0 ? "+" : ""}₹{net.toLocaleString("en-IN")} Cr
          </span>
        </div>
        
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            <span>Buy (₹{buy.toLocaleString("en-IN")})</span>
            <span>Sell (₹{sell.toLocaleString("en-IN")})</span>
          </div>
          <div className="flex h-2 w-full rounded-full overflow-hidden bg-muted">
            <div className="bg-success h-full" style={{ width: `${(buy / (buy + sell || 1)) * 100}%` }} />
            <div className="bg-destructive h-full" style={{ width: `${(sell / (buy + sell || 1)) * 100}%` }} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50 h-full flex flex-col">
      <CardHeader className="pb-2 border-b border-border/50">
        <CardTitle className="text-sm font-semibold flex items-center justify-between">
          FII / DII Activity
          <span className="text-xs font-normal text-muted-foreground">Today</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 grid grid-cols-2 divide-x divide-border/50">
        <div className="p-4">
          <h4 className="font-bold text-primary tracking-tight">FII</h4>
          {renderBar(fii.buy, fii.sell, fii.net)}
        </div>
        <div className="p-4">
          <h4 className="font-bold text-primary tracking-tight">DII</h4>
          {renderBar(dii.buy, dii.sell, dii.net)}
        </div>
      </CardContent>
    </Card>
  );
}
