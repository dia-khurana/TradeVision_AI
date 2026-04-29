import type { Alert } from "@workspace/api-client-react";
import { formatDistanceToNow } from "date-fns";
import { Info, AlertTriangle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AlertsListProps {
  alerts: Alert[];
}

export function AlertsList({ alerts }: AlertsListProps) {
  return (
    <div className="premium-card h-full flex flex-col">
      <div className="px-4 py-3 border-b border-indigo-100 flex items-center justify-between">
        <div className="text-sm font-bold tracking-tight">Live Alerts</div>
        <span className="text-[10px] uppercase tracking-widest font-bold text-indigo-600 pulse-dot">Live</span>
      </div>
      <div className="flex-1 overflow-auto max-h-[300px]">
        {alerts.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">No recent alerts.</div>
        ) : (
          <div className="divide-y divide-indigo-50">
            {alerts.map((alert) => {
              let Icon = Info;
              let cls = "text-sky-500 bg-sky-50";
              if (alert.severity === "warning") {
                Icon = AlertTriangle;
                cls = "text-amber-500 bg-amber-50";
              } else if (alert.severity === "critical") {
                Icon = AlertCircle;
                cls = "text-rose-500 bg-rose-50";
              }
              return (
                <div
                  key={alert.id}
                  className={cn(
                    "flex gap-3 p-3 hover:bg-indigo-50/50 transition-colors",
                    !alert.isRead && "bg-indigo-50/30",
                  )}
                >
                  <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center shrink-0", cls)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <p className="text-sm font-medium leading-tight">{alert.message}</p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                      <span className="text-indigo-700">{alert.type}</span>
                      <span>·</span>
                      <span>{formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
