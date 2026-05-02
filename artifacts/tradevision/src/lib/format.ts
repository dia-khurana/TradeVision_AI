// Indian number formatting helpers (lakh / crore + Indian comma grouping).

const INR_FMT = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
const INR_FMT_2 = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// 1,23,45,678 — Indian grouping, no currency symbol.
export function fmtIN(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return INR_FMT.format(Math.round(n));
}

// ₹1,23,456.78
export function fmtINR(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return `₹${INR_FMT_2.format(n)}`;
}

// Compact crore/lakh/k formatter for big numbers (volume, turnover, P&L sums).
//   1,25,00,000 → "1.25 Cr"
//      85,00,000 → "85.00 L"
//          12,500 → "12.5 K"
export function fmtCompact(n: number, withRupee = false): string {
  if (!Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  const prefix = withRupee ? "₹" : "";
  if (abs >= 1e7) return `${sign}${prefix}${(abs / 1e7).toFixed(2)} Cr`;
  if (abs >= 1e5) return `${sign}${prefix}${(abs / 1e5).toFixed(2)} L`;
  if (abs >= 1e3) return `${sign}${prefix}${(abs / 1e3).toFixed(1)} K`;
  return `${sign}${prefix}${abs.toFixed(0)}`;
}

// Just the volume short form, no rupee.
export function fmtVol(n: number): string {
  return fmtCompact(n, false);
}

// "+₹1,234 (+1.23%)" coloured externally
export function fmtSignedINR(n: number): string {
  if (!Number.isFinite(n)) return "—";
  const sign = n >= 0 ? "+" : "-";
  return `${sign}₹${INR_FMT.format(Math.abs(Math.round(n)))}`;
}

export function fmtPct(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return "—";
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(digits)}%`;
}
