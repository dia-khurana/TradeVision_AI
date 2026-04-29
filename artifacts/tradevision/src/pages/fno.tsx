import { useGetOptionsChain, getGetOptionsChainQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function Fno() {
  const { data, isLoading } = useGetOptionsChain({
    query: { queryKey: getGetOptionsChainQueryKey(), refetchInterval: 30000 }
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">F&O Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Options chain analysis and derivatives data.</p>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-[120px] w-full rounded-xl bg-muted/50" />
          <div className="grid md:grid-cols-2 gap-6">
             <Skeleton className="h-[400px] w-full rounded-xl bg-muted/50" />
             <Skeleton className="h-[400px] w-full rounded-xl bg-muted/50" />
          </div>
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-5">
              <div className="text-sm text-muted-foreground mb-1">Underlying</div>
              <div className="text-2xl font-bold font-mono tracking-tight">{data.underlyingValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
              <div className="text-xs text-muted-foreground mt-1">{data.underlying}</div>
            </div>
            
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-5 relative overflow-hidden">
              <div className="text-sm text-muted-foreground mb-1">PCR</div>
              <div className="text-2xl font-bold font-mono tracking-tight">{data.pcr.toFixed(2)}</div>
              <Badge variant="outline" className={cn(
                "absolute top-5 right-5 text-[10px] uppercase font-bold",
                data.bias === "bullish" ? "border-success/50 text-success bg-success/10" :
                data.bias === "bearish" ? "border-destructive/50 text-destructive bg-destructive/10" :
                "border-muted-foreground/30 text-muted-foreground bg-muted/50"
              )}>
                {data.bias}
              </Badge>
            </div>

            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-5">
              <div className="text-sm text-muted-foreground mb-1">Max Pain</div>
              <div className="text-2xl font-bold font-mono tracking-tight">{data.maxPain}</div>
              <div className="text-xs text-muted-foreground mt-1">Strike Price</div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-xl border border-border/50 overflow-hidden bg-card/30">
              <div className="bg-success/5 border-b border-success/20 p-4">
                <h3 className="font-bold text-success flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-success" />
                  Top Calls (CE)
                </h3>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/50">
                    <TableHead className="font-mono">Strike</TableHead>
                    <TableHead className="text-right">OI</TableHead>
                    <TableHead className="text-right">Chg OI</TableHead>
                    <TableHead className="text-right">LTP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.topCE.map(strike => (
                    <TableRow key={strike.strike} className="border-border/50 hover:bg-muted/30">
                      <TableCell className="font-mono font-bold">{strike.strike}</TableCell>
                      <TableCell className="text-right font-mono">{strike.oi.toLocaleString()}</TableCell>
                      <TableCell className={cn(
                        "text-right font-mono",
                        strike.chgOi > 0 ? "text-success" : strike.chgOi < 0 ? "text-destructive" : ""
                      )}>
                        {strike.chgOi > 0 ? "+" : ""}{strike.chgOi.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono">₹{strike.ltp.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="rounded-xl border border-border/50 overflow-hidden bg-card/30">
              <div className="bg-destructive/5 border-b border-destructive/20 p-4">
                <h3 className="font-bold text-destructive flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-destructive" />
                  Top Puts (PE)
                </h3>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/50">
                    <TableHead className="font-mono">Strike</TableHead>
                    <TableHead className="text-right">OI</TableHead>
                    <TableHead className="text-right">Chg OI</TableHead>
                    <TableHead className="text-right">LTP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.topPE.map(strike => (
                    <TableRow key={strike.strike} className="border-border/50 hover:bg-muted/30">
                      <TableCell className="font-mono font-bold">{strike.strike}</TableCell>
                      <TableCell className="text-right font-mono">{strike.oi.toLocaleString()}</TableCell>
                      <TableCell className={cn(
                        "text-right font-mono",
                        strike.chgOi > 0 ? "text-success" : strike.chgOi < 0 ? "text-destructive" : ""
                      )}>
                        {strike.chgOi > 0 ? "+" : ""}{strike.chgOi.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono">₹{strike.ltp.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
