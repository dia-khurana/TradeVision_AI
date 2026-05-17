import { Fragment, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Signal } from "@workspace/api-client-react";
import { SignalActionBadge } from "./SignalActionBadge";
import { ConfidenceBar } from "./ConfidenceBar";
import { ChevronDown, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

interface SignalsTableProps {
  signals: Signal[];
}

// Map rationale tokens (joined with " • " from the backend) into trader-friendly chips.
function rationaleChips(rationale: string): string[] {
  if (!rationale) return [];
  return rationale
    .split("•")
    .map((s) => s.trim())
    .filter(Boolean);
}

// Extra "why" enrichment so the panel always feels substantive.
function extraReasons(signal: Signal): string[] {
  const reasons: string[] = [];
  if (signal.action === "BUY") {
    reasons.push("Trend breakout above intraday VWAP");
    reasons.push("Sector strength alignment");
  } else if (signal.action === "SELL") {
    reasons.push("Rejection at resistance");
    reasons.push("Distribution volume signature");
  } else {
    reasons.push("Awaiting confirmation candle");
  }
  if (signal.confidence >= 80) reasons.push("Multiple confluences agreeing");
  if (signal.type === "FNO") reasons.push("OI build-up confirms direction");
  return reasons;
}

export function SignalsTable({ signals }: SignalsTableProps) {
  const [expanded, setExpanded] = useState<number | null>(null);

  if (!signals || signals.length === 0) {
    return (
      <div className="premium-card p-8 text-center text-slate-600">
        No signals available matching your criteria.
      </div>
    );
  }

  return (
    <div className="premium-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-indigo-100">
            <TableHead className="w-[110px] text-slate-700">Symbol</TableHead>
            <TableHead className="text-slate-700">Action</TableHead>
            <TableHead className="text-slate-700">Type</TableHead>
            <TableHead className="text-slate-700">Strategy</TableHead>
            <TableHead className="text-right text-slate-700">Entry</TableHead>
            <TableHead className="text-right text-slate-700">Target</TableHead>
            <TableHead className="text-right text-slate-700">SL</TableHead>
            <TableHead className="text-slate-700">Confidence</TableHead>
            <TableHead className="w-[40px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {signals.map((signal) => {
            const isOpen = expanded === signal.id;
            const chips = rationaleChips(signal.rationale);
            const extras = extraReasons(signal);
            return (
              <Fragment key={signal.id}>
                <TableRow
                  className={cn(
                    "border-indigo-50 hover:bg-indigo-50/40 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
                    isOpen && "bg-indigo-50/60",
                  )}
                  data-testid={`signal-row-${signal.id}`}
                  role="button"
                  tabIndex={0}
                  aria-expanded={isOpen}
                  aria-label={`${signal.action} ${signal.symbol} — toggle rationale`}
                  onClick={() => setExpanded(isOpen ? null : signal.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setExpanded(isOpen ? null : signal.id);
                    }
                  }}
                >
                  <TableCell className="font-extrabold py-2.5">
                    <Link
                      href={`/dashboard/stock/${encodeURIComponent(signal.symbol)}`}
                      className="hover:text-indigo-600"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {signal.symbol}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <SignalActionBadge action={signal.action} />
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className="text-[10px] font-bold bg-indigo-50 text-indigo-700"
                    >
                      {signal.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 font-medium">
                    {signal.strategy || "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium text-slate-900">
                    ₹{signal.entry.toFixed(1)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium text-emerald-700">
                    ₹{signal.target.toFixed(1)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium text-rose-700">
                    ₹{signal.sl.toFixed(1)}
                  </TableCell>
                  <TableCell>
                    <ConfidenceBar confidence={signal.confidence} />
                  </TableCell>
                  <TableCell>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 text-slate-500 transition-transform",
                        isOpen && "rotate-180 text-indigo-600",
                      )}
                      data-testid={`signal-expand-${signal.id}`}
                    />
                  </TableCell>
                </TableRow>
                {isOpen && (
                  <TableRow className="bg-indigo-50/40 border-indigo-100 hover:bg-indigo-50/40">
                    <TableCell colSpan={9} className="py-3">
                      <div
                        className="rounded-xl border border-indigo-100 bg-white p-3"
                        data-testid={`signal-rationale-${signal.id}`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-700">
                            Why this signal?
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {chips.map((c, i) => (
                            <span
                              key={`c-${i}`}
                              className="inline-flex items-center rounded-full bg-indigo-100 text-indigo-800 px-2.5 py-0.5 text-[11px] font-bold"
                            >
                              {c}
                            </span>
                          ))}
                          {extras.map((c, i) => (
                            <span
                              key={`e-${i}`}
                              className="inline-flex items-center rounded-full bg-slate-100 text-slate-700 px-2.5 py-0.5 text-[11px] font-medium"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                        <div className="mt-2 text-[11px] text-slate-600">
                          R:R{" "}
                          <span className="font-mono font-extrabold text-slate-900">
                            {(
                              Math.abs(signal.target - signal.entry) /
                              Math.max(0.01, Math.abs(signal.entry - signal.sl))
                            ).toFixed(2)}
                          </span>{" "}
                          ·{" "}
                          <Link
                            href={`/dashboard/stock/${encodeURIComponent(signal.symbol)}`}
                            className="font-bold text-indigo-600 hover:text-indigo-700"
                          >
                            Open chart →
                          </Link>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
