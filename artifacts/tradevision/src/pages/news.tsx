import { useGetNews, getGetNewsQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Newspaper, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function News() {
  const { data, isLoading } = useGetNews({
    query: { queryKey: getGetNewsQueryKey(), refetchInterval: 5 * 60_000 },
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-2">
          <Newspaper className="h-6 w-6 text-indigo-500" /> Live Market News
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Aggregated from ETMarkets, LiveMint, MoneyControl, Business Standard
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-[100px] rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {(data?.articles ?? []).map((a) => (
            <a
              key={a.id}
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              className="premium-card p-4 block group"
            >
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant="outline"
                      className="text-[9px] uppercase font-extrabold tracking-wider border-indigo-200 text-indigo-700 bg-indigo-50"
                    >
                      {a.source}
                    </Badge>
                    {a.category && (
                      <span className="text-[9px] uppercase font-extrabold tracking-wider px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">
                        {a.category}
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                      {formatDistanceToNow(new Date(a.publishedAt), { addSuffix: true })}
                    </span>
                  </div>
                  <h3 className="font-extrabold tracking-tight text-base group-hover:text-indigo-600">
                    {a.title}
                  </h3>
                  {a.summary && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{a.summary}</p>
                  )}
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-indigo-600" />
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
