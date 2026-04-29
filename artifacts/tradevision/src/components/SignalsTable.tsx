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
import { Signal } from "@workspace/api-client-react";
import { SignalActionBadge } from "./SignalActionBadge";
import { ConfidenceBar } from "./ConfidenceBar";
import { Info } from "lucide-react";

interface SignalsTableProps {
  signals: Signal[];
}

export function SignalsTable({ signals }: SignalsTableProps) {
  if (!signals || signals.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No signals available matching your criteria.
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border/50 overflow-hidden bg-card/30">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-border/50">
            <TableHead className="w-[100px]">Symbol</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Entry</TableHead>
            <TableHead className="text-right">Target</TableHead>
            <TableHead className="text-right">SL</TableHead>
            <TableHead>Confidence</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {signals.map((signal) => (
            <TableRow key={signal.id} className="border-border/50 hover:bg-muted/30">
              <TableCell className="font-bold">{signal.symbol}</TableCell>
              <TableCell>
                <SignalActionBadge action={signal.action} />
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="text-[10px] font-medium bg-secondary/50">
                  {signal.type}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-medium">₹{signal.entry.toFixed(1)}</TableCell>
              <TableCell className="text-right font-medium text-success">₹{signal.target.toFixed(1)}</TableCell>
              <TableCell className="text-right font-medium text-destructive">₹{signal.sl.toFixed(1)}</TableCell>
              <TableCell>
                <ConfidenceBar confidence={signal.confidence} />
              </TableCell>
              <TableCell>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
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
