export function ConfidenceBar({ confidence }: { confidence: number }) {
  const pct = Math.max(0, Math.min(100, confidence));
  return (
    <div className="flex items-center gap-2 w-full max-w-[110px]">
      <div className="h-1.5 w-full rounded-full overflow-hidden bg-indigo-100">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground font-bold w-8 text-right tabular-nums">
        {pct}%
      </span>
    </div>
  );
}
