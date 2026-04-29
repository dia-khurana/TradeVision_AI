import { Progress } from "@/components/ui/progress";

export function ConfidenceBar({ confidence }: { confidence: number }) {
  return (
    <div className="flex items-center gap-2 w-full max-w-[100px]">
      <Progress value={confidence} className="h-1.5 bg-muted" />
      <span className="text-xs text-muted-foreground font-medium w-8 text-right">
        {confidence}%
      </span>
    </div>
  );
}
