import {
  useGetAlerts,
  getGetAlertsQueryKey,
  useMarkAlertRead,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, Info, AlertTriangle, AlertCircle, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";

export default function Alerts() {
  const qc = useQueryClient();
  const { data, isLoading } = useGetAlerts({
    query: { queryKey: getGetAlertsQueryKey(), refetchInterval: 60_000 },
  });
  const mark = useMarkAlertRead();

  const refresh = () => qc.invalidateQueries({ queryKey: getGetAlertsQueryKey() });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-2">
          <Bell className="h-6 w-6 text-indigo-500" /> Alerts
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Live signal & bot notifications · Auto-refresh every minute
        </p>
      </div>

      {isLoading ? (
        <Skeleton className="h-[400px] w-full rounded-2xl" />
      ) : (data?.alerts ?? []).length === 0 ? (
        <div className="premium-card p-10 text-center text-muted-foreground">
          No alerts yet. They will appear here as bots and signals fire.
        </div>
      ) : (
        <div className="premium-card divide-y divide-indigo-50">
          {data?.alerts.map((a) => {
            let Icon = Info;
            let cls = "text-sky-500 bg-sky-50";
            if (a.severity === "warning") {
              Icon = AlertTriangle;
              cls = "text-amber-500 bg-amber-50";
            } else if (a.severity === "critical") {
              Icon = AlertCircle;
              cls = "text-rose-500 bg-rose-50";
            }
            return (
              <div
                key={a.id}
                className={cn(
                  "flex gap-3 p-4 items-center",
                  !a.isRead && "bg-indigo-50/30",
                )}
              >
                <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0", cls)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-tight">{a.message}</p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-wider font-bold mt-1">
                    <span className="text-indigo-700">{a.type}</span>
                    <span>·</span>
                    <span>{formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}</span>
                  </div>
                </div>
                {!a.isRead && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => mark.mutate({ id: a.id }, { onSuccess: refresh })}
                    className="text-xs"
                  >
                    <CheckCheck className="h-3.5 w-3.5 mr-1" />
                    Mark read
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
