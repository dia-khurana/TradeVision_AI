import { OptionsResponse } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface OptionsSnapshotProps {
  data: OptionsResponse;
}

export function OptionsSnapshot({ data }: OptionsSnapshotProps) {
  const noData = !data.topCE.length && !data.topPE.length && data.pcr === 0;
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50 h-full flex flex-col">
      <CardHeader className="pb-2 border-b border-border/50">
        <CardTitle className="text-sm font-semibold flex justify-between items-center">
          Options Chain
          <Badge variant="outline" className={cn(
            "text-[10px] uppercase font-bold",
            data.bias === "bullish" ? "border-success/50 text-success bg-success/10" :
            data.bias === "bearish" ? "border-destructive/50 text-destructive bg-destructive/10" :
            "border-muted-foreground/30 text-muted-foreground bg-muted/50"
          )}>
            {data.bias} bias
          </Badge>
        </CardTitle>
        {data.stale ? (
          <p className="text-[10px] text-amber-400/80 mt-1">
            NSE option chain temporarily unavailable — showing last cached values
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="p-4 flex-1">
        {noData ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-6 text-muted-foreground">
            <div className="text-xs uppercase tracking-wider mb-1">F&amp;O Snapshot</div>
            <div className="text-sm">Waiting for NSE option-chain access — refreshes every 30s.</div>
          </div>
        ) : (
        <>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-muted/30 p-3 rounded-lg border border-border/30">
            <div className="text-xs text-muted-foreground mb-1">PCR</div>
            <div className="text-xl font-bold font-mono tracking-tight">{data.pcr.toFixed(2)}</div>
          </div>
          <div className="bg-muted/30 p-3 rounded-lg border border-border/30">
            <div className="text-xs text-muted-foreground mb-1">Max Pain</div>
            <div className="text-xl font-bold font-mono tracking-tight">{data.maxPain}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h5 className="text-[10px] uppercase font-bold text-muted-foreground mb-2 tracking-wider">Top Calls</h5>
            <div className="space-y-1">
              {data.topCE.slice(0, 3).map((strike) => (
                <div key={strike.strike} className="flex justify-between items-center text-xs p-1.5 rounded bg-muted/20">
                  <span className="font-mono">{strike.strike}</span>
                  <span className="text-muted-foreground">{strike.oi}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h5 className="text-[10px] uppercase font-bold text-muted-foreground mb-2 tracking-wider">Top Puts</h5>
            <div className="space-y-1">
              {data.topPE.slice(0, 3).map((strike) => (
                <div key={strike.strike} className="flex justify-between items-center text-xs p-1.5 rounded bg-muted/20">
                  <span className="font-mono">{strike.strike}</span>
                  <span className="text-muted-foreground">{strike.oi}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        </>
        )}
      </CardContent>
    </Card>
  );
}
