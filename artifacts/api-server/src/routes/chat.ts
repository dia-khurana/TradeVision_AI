import { Router, type IRouter } from "express";
import { PostChatBody, PostChatResponse } from "@workspace/api-zod";
import { snapshot } from "../lib/marketService";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

function reply(message: string): { reply: string; ctx: { vix: number; pcr: number; fiiNet: number; diiNet: number } } {
  const snap = snapshot();
  const vix =
    snap.indices?.indices.find((i) => i.symbol === "VIX")?.price ?? 0;
  const pcr = snap.options?.pcr ?? 0;
  const fiiNet = snap.fiiDii?.fii.net ?? 0;
  const diiNet = snap.fiiDii?.dii.net ?? 0;
  const bias = snap.options?.bias ?? "neutral";
  const nifty =
    snap.indices?.indices.find((i) => i.symbol === "NIFTY")?.price ?? 0;
  const niftyChg =
    snap.indices?.indices.find((i) => i.symbol === "NIFTY")?.changePct ?? 0;

  const m = message.toLowerCase();

  let text = "";
  if (m.includes("vix")) {
    if (vix === 0) text = "INDIA VIX data is not available right now.";
    else if (vix < 14)
      text = `INDIA VIX is ${vix.toFixed(2)} — low volatility regime. Premium-selling strategies (covered calls, iron condors, credit spreads) are favoured. Keep position sizes modest because IV expansion can be sudden.`;
    else if (vix > 20)
      text = `INDIA VIX is ${vix.toFixed(2)} — elevated volatility. Consider buying hedges (protective puts, long straddles) and trimming naked premium-selling. Tighten stops on directional positions.`;
    else
      text = `INDIA VIX is ${vix.toFixed(2)} — normal volatility regime. No special posture; stick to your usual risk parameters.`;
  } else if (m.includes("pcr") || m.includes("put") || m.includes("call ratio")) {
    if (pcr === 0) text = "Options PCR is not available right now.";
    else
      text = `NIFTY put-call ratio is ${pcr.toFixed(2)} → ${bias} bias. ${
        pcr > 1.2
          ? "Heavy put writing usually signals downside support — directional shorts need confirmation."
          : pcr < 0.8
            ? "Heavy call writing signals overhead resistance — rallies may be sold."
            : "Distribution is balanced — wait for one side to dominate."
      }`;
  } else if (m.includes("fii")) {
    text = `FII net flow today: ${fiiNet >= 0 ? "+" : ""}₹${fiiNet.toFixed(0)}cr. ${
      fiiNet > 500
        ? "Strong inflow — institutional support for the tape."
        : fiiNet < -500
          ? "Strong outflow — be cautious on long-only exposure."
          : "Flows are roughly balanced."
    }`;
  } else if (m.includes("dii")) {
    text = `DII net flow today: ${diiNet >= 0 ? "+" : ""}₹${diiNet.toFixed(0)}cr. ${
      diiNet > 0
        ? "Domestic institutions buying — usually a steady-hand support."
        : "Domestic institutions distributing — watch for follow-through selling."
    }`;
  } else if (m.includes("nifty") || m.includes("market")) {
    text = `NIFTY 50 is ${nifty.toFixed(2)} (${niftyChg >= 0 ? "+" : ""}${niftyChg.toFixed(2)}%). PCR ${pcr.toFixed(2)} (${bias}). VIX ${vix.toFixed(2)}. FII ${fiiNet >= 0 ? "+" : ""}${fiiNet.toFixed(0)}cr · DII ${diiNet >= 0 ? "+" : ""}${diiNet.toFixed(0)}cr.`;
  } else if (m.includes("buy") || m.includes("sell") || m.includes("trade") || m.includes("signal")) {
    text = `Open the Signals tab for the latest rule-based picks. Today's market posture: PCR ${pcr.toFixed(2)} (${bias}), VIX ${vix.toFixed(2)}, FII ${fiiNet >= 0 ? "+" : ""}${fiiNet.toFixed(0)}cr. ${
      bias === "bullish"
        ? "Bias favours buy-on-dips."
        : bias === "bearish"
          ? "Bias favours sell-on-rallies."
          : "Bias is neutral — trade range, not direction."
    }`;
  } else {
    text = `Live snapshot — NIFTY ${nifty.toFixed(2)} (${niftyChg >= 0 ? "+" : ""}${niftyChg.toFixed(2)}%) · VIX ${vix.toFixed(2)} · PCR ${pcr.toFixed(2)} (${bias}) · FII ${fiiNet >= 0 ? "+" : ""}${fiiNet.toFixed(0)}cr · DII ${diiNet >= 0 ? "+" : ""}${diiNet.toFixed(0)}cr. Ask me about VIX, PCR, FII, DII, or signals.`;
  }

  return { reply: text, ctx: { vix, pcr, fiiNet, diiNet } };
}

router.post("/chat", requireAuth, (req, res) => {
  const parse = PostChatBody.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const { reply: text, ctx } = reply(parse.data.message);
  res.json(PostChatResponse.parse({ reply: text, context: ctx }));
});

export default router;
