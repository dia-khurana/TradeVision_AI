import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function AiBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest",
        "bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white shadow-sm",
        className,
      )}
    >
      <Sparkles className="h-2.5 w-2.5" /> AI
    </span>
  );
}
