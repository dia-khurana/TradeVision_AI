import { ai } from "@workspace/integrations-gemini-ai";
import { snapshot, fetchQuote } from "./marketService";
import { logger } from "./logger";

const MODEL = "gemini-2.5-flash";

function buildSystemInstruction(): string {
  const snap = snapshot();
  const indices = snap.indices?.indices ?? [];
  const fii = snap.fiiDii;
  const opt = snap.options;

  const idxBrief = indices
    .map((i) => `${i.symbol} ${i.price.toFixed(2)} (${i.changePct >= 0 ? "+" : ""}${i.changePct.toFixed(2)}%)`)
    .join(" · ");
  const fiiBrief = fii
    ? `FII ${fii.fii.net >= 0 ? "+" : ""}${fii.fii.net.toFixed(0)}cr · DII ${fii.dii.net >= 0 ? "+" : ""}${fii.dii.net.toFixed(0)}cr`
    : "FII/DII unavailable";
  const optBrief = opt && opt.underlyingValue > 0
    ? `NIFTY ATM ${opt.atm} · PCR ${opt.pcr.toFixed(2)} (${opt.bias}) · MaxPain ${opt.maxPain}`
    : "Options chain unavailable";

  return [
    "You are TradeVision AI, an expert assistant for Indian stock market traders.",
    "You analyse charts, indices, options and answer questions concisely with actionable insight.",
    "When the user uploads a chart screenshot, identify the timeframe, trend, key support/resistance, candle patterns, and indicators visible. End with a clear bias (Bullish/Bearish/Neutral) and one risk note.",
    "Always reference live data when relevant. Never give personalised investment advice; frame ideas as educational analysis.",
    "Live snapshot:",
    `  Indices: ${idxBrief || "n/a"}`,
    `  Flows: ${fiiBrief}`,
    `  Options: ${optBrief}`,
  ].join("\n");
}

export interface GeminiChatHistoryItem {
  role: "user" | "model";
  text: string;
}

export async function geminiChat(opts: {
  message: string;
  imageBase64?: string;
  imageMimeType?: string;
  history?: GeminiChatHistoryItem[];
}): Promise<string> {
  const { message, imageBase64, imageMimeType, history } = opts;

  // If user mentions a specific symbol we know about, attach a fresh quote
  let extra = "";
  const m = message.toUpperCase();
  const tracked = ["RELIANCE", "HDFCBANK", "INFY", "TCS", "TATASTEEL", "BAJFINANCE", "ICICIBANK", "AXISBANK", "SBIN", "WIPRO", "ZOMATO", "ADANIENT", "HCLTECH", "MARUTI", "LTIM"];
  for (const sym of tracked) {
    if (m.includes(sym)) {
      const q = await fetchQuote(sym);
      if (q) {
        extra = `\n  Live ${sym}: ${q.price.toFixed(2)} (${q.changePct >= 0 ? "+" : ""}${q.changePct.toFixed(2)}%) · day ${q.dayLow.toFixed(2)}–${q.dayHigh.toFixed(2)}`;
      }
      break;
    }
  }

  const systemInstruction = buildSystemInstruction() + extra;

  const contents: Array<{ role: string; parts: Array<{ text?: string; inlineData?: { data: string; mimeType: string } }> }> = [];
  if (history) {
    for (const h of history.slice(-8)) {
      contents.push({ role: h.role, parts: [{ text: h.text }] });
    }
  }
  const userParts: Array<{ text?: string; inlineData?: { data: string; mimeType: string } }> = [];
  userParts.push({ text: message });
  if (imageBase64 && imageMimeType) {
    userParts.push({
      inlineData: { data: imageBase64, mimeType: imageMimeType },
    });
  }
  contents.push({ role: "user", parts: userParts });

  try {
    const res = await ai.models.generateContent({
      model: MODEL,
      contents,
      config: {
        systemInstruction,
        temperature: 0.4,
      },
    });
    const text = res.text ?? "";
    return text || "I couldn't generate a response. Please try again.";
  } catch (err) {
    logger.error({ err: (err as Error).message }, "gemini chat failed");
    return "AI is temporarily unavailable. Please retry in a moment.";
  }
}
