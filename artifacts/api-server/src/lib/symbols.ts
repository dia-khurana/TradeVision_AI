export const TRACKED_SYMBOLS: Array<{
  symbol: string;
  name: string;
  sector: string;
}> = [
  { symbol: "RELIANCE", name: "Reliance Industries", sector: "Energy" },
  { symbol: "HDFCBANK", name: "HDFC Bank", sector: "Banking" },
  { symbol: "INFY", name: "Infosys", sector: "IT" },
  { symbol: "TCS", name: "Tata Consultancy Services", sector: "IT" },
  { symbol: "TATASTEEL", name: "Tata Steel", sector: "Metals" },
  { symbol: "BAJFINANCE", name: "Bajaj Finance", sector: "NBFC" },
  { symbol: "ICICIBANK", name: "ICICI Bank", sector: "Banking" },
  { symbol: "AXISBANK", name: "Axis Bank", sector: "Banking" },
  { symbol: "SBIN", name: "State Bank of India", sector: "Banking" },
  { symbol: "WIPRO", name: "Wipro", sector: "IT" },
  { symbol: "ZOMATO", name: "Zomato", sector: "Consumer" },
  { symbol: "ADANIENT", name: "Adani Enterprises", sector: "Conglomerate" },
  { symbol: "HCLTECH", name: "HCL Technologies", sector: "IT" },
  { symbol: "MARUTI", name: "Maruti Suzuki", sector: "Auto" },
  { symbol: "LTIM", name: "LTIMindtree", sector: "IT" },
];

export const TRACKED_SYMBOL_LIST = TRACKED_SYMBOLS.map((s) => s.symbol);

export function symbolMeta(sym: string): { name: string; sector: string } {
  const found = TRACKED_SYMBOLS.find((s) => s.symbol === sym.toUpperCase());
  if (found) return { name: found.name, sector: found.sector };
  return { name: sym.toUpperCase(), sector: "Other" };
}

export function toYahooNse(symbol: string): string {
  return `${symbol.toUpperCase()}.NS`;
}
