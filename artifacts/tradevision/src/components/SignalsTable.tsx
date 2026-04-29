import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import type { Signal } from "@workspace/api-client-react";
import { SignalActionBadge } from "./SignalActionBadge";
import { ConfidenceBar } from "./ConfidenceBar";
import { Info } from "lucide-react";
import { Link } from "wouter";

interface SignalsTableProps {
  signals: Signal[];
}

export function SignalsTable({ signals }: SignalsTableProps) {
  if (!signals || signals.length === 0) {
    return (
      <div className="premium-card p-8 text-center text-muted-foreground">
        No signals available matching your criteria.
      </div>
    );
  }

  return (
    <div className="premium-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-indigo-100">
            <TableHead className="w-[110px]">Symbol</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Strategy</TableHead>
            <TableHead className="text-right">Entry</TableHead>
            <TableHead className="text-right">Target</TableHead>
            <TableHead className="text-right">SL</TableHead>
            <TableHead>Confidence</TableHead>
            <TableHead className="w-[40px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {signals.map((signal) => (
            <TableRow
              key={signal.id}
              className="border-indigo-50 hover:bg-indigo-50/40"
              data-testid={`signal-row-${signal.id}`}
            >
              <TableCell className="font-extrabold">
                <Link
                  href={`/dashboard/stock/${encodeURIComponent(signal.symbol)}`}
                  className="hover:text-indigo-600"
                >
                  {signal.symbol}
                </Link>
              </TableCell>
              <TableCell>
                <SignalActionBadge action={signal.action} />
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="text-[10px] font-bold bg-indigo-50 text-indigo-700">
                  {signal.type}
                </Badge>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground font-medium">
                {signal.strategy ?? "—"}
              </TableCell>
              <TableCell className="text-right font-mono font-medium">
                ₹{signal.entry.toFixed(1)}
              </TableCell>
              <TableCell className="text-right font-mono font-medium text-emerald-600">
                ₹{signal.target.toFixed(1)}
              </TableCell>
              <TableCell className="text-right font-mono font-medium text-rose-600">
                ₹{signal.sl.toFixed(1)}
              </TableCell>
              <TableCell>
                <ConfidenceBar confidence={signal.confidence} />
              </TableCell>
              <TableCell>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help hover:text-indigo-600 transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[300px] text-sm">
                    <p>{signal.rationale}</p>
                  </TooltipContent>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
