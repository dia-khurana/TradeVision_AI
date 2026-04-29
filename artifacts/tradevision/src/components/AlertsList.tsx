import { Alert } from "@workspace/api-client-react";
import { formatDistanceToNow } from "date-fns";
import { Info, AlertTriangle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AlertsListProps {
  alerts: Alert[];
}

export function AlertsList({ alerts }: AlertsListProps) {
  if (!alerts || alerts.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50 h-full">
        <CardHeader className="pb-2 border-b border-border/50">
          <CardTitle className="text-sm font-semibold">Live Alerts</CardTitle>
        </CardHeader>
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          No recent alerts.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50 h-full flex flex-col">
      <CardHeader className="pb-2 border-b border-border/50">
        <CardTitle className="text-sm font-semibold">Live Alerts</CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-auto max-h-[300px]">
        <div className="divide-y divide-border/50">
          {alerts.map((alert) => {
            let Icon = Info;
            let iconClass = "text-blue-500";
            
            if (alert.severity === "warning") {
              Icon = AlertTriangle;
              iconClass = "text-amber-500";
            } else if (alert.severity === "critical") {
              Icon = AlertCircle;
              iconClass = "text-destructive";
            }

            return (
              <div key={alert.id} className="flex gap-3 p-3 hover:bg-muted/30 transition-colors">
                <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", iconClass)} />
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-tight">{alert.message}</p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                    <span className="text-foreground/70">{alert.type}</span>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
