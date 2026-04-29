import { useState, useRef, useEffect } from "react";
import {
  usePostChat,
  useGetChatHistory,
  getGetChatHistoryQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Image as ImageIcon, X, Bot, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

type Msg = { role: "user" | "assistant"; content: string; image?: string };

async function fileToDataUrl(f: File) {
  return new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = rej;
    r.readAsDataURL(f);
  });
}

export default function Chat() {
  const qc = useQueryClient();
  const { data: history } = useGetChatHistory({
    query: { queryKey: getGetChatHistoryQueryKey() },
  });
  const [messages, setMessages] = useState<Msg[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [input, setInput] = useState("");
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const postChat = usePostChat();

  useEffect(() => {
    if (!hydrated && history?.messages) {
      const seed: Msg[] = history.messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));
      setMessages(
        seed.length > 0
          ? seed
          : [
              {
                role: "assistant",
                content:
                  "Hi! I'm **TradeVision AI** with access to **live NSE quotes**, your **portfolio**, and **vision**. Drop a chart screenshot or just ask anything. ✨",
              },
            ],
      );
      setHydrated(true);
    }
  }, [history, hydrated]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, postChat.isPending]);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed && !pendingImage) return;
    const u: Msg = { role: "user", content: trimmed || "(image)", image: pendingImage ?? undefined };
    setMessages((p) => [...p, u]);
    setInput("");
    const img = pendingImage;
    setPendingImage(null);

    let imageBase64: string | undefined;
    let imageMimeType: string | undefined;
    if (img) {
      const m = img.match(/^data:([^;]+);base64,(.+)$/);
      if (m) {
        imageMimeType = m[1];
        imageBase64 = m[2];
      }
    }

    postChat.mutate(
      {
        data: {
          message: trimmed || "Analyse this chart.",
          imageBase64,
          imageMimeType,
        },
      },
      {
        onSuccess: (d) => {
          setMessages((p) => [...p, { role: "assistant", content: d.reply }]);
          qc.invalidateQueries({ queryKey: getGetChatHistoryQueryKey() });
        },
        onError: () =>
          setMessages((p) => [
            ...p,
            { role: "assistant", content: "Sorry, I had trouble reaching the live feed." },
          ]),
      },
    );
  };

  const chips = [
    "What's NIFTY's bias today?",
    "Analyse my portfolio",
    "Best BUY signal right now?",
    "Why is BANKNIFTY moving?",
    "Summarise top 3 news",
    "PCR interpretation?",
  ];

  return (
    <div className="max-w-4xl mx-auto h-[calc(100dvh-12rem)] flex flex-col">
      <div className="mb-4 flex items-center gap-3">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <Sparkles className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            <span className="gradient-text">AI Chat</span>
          </h1>
          <p className="text-xs uppercase font-bold tracking-widest text-muted-foreground">
            Gemini 2.5 · Live data · Vision enabled
          </p>
        </div>
      </div>

      <div className="premium-card flex-1 flex flex-col overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={cn("flex max-w-[85%]", m.role === "user" ? "ml-auto" : "mr-auto")}>
              <div
                className={cn(
                  "p-3 rounded-2xl text-sm prose prose-sm max-w-none",
                  m.role === "user"
                    ? "bg-gradient-to-br from-indigo-500 to-purple-500 text-white prose-invert rounded-tr-sm"
                    : "bg-white/80 border border-indigo-100 text-foreground rounded-tl-sm shadow-sm",
                )}
              >
                {m.image && (
                  <img
                    src={m.image}
                    alt=""
                    className="rounded-lg mb-2 max-h-64 w-full object-contain bg-black/5"
                  />
                )}
                {m.role === "assistant" ? (
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                ) : (
                  <span>{m.content}</span>
                )}
              </div>
            </div>
          ))}
          {postChat.isPending && (
            <div className="flex max-w-[85%] mr-auto">
              <div className="p-3 rounded-2xl text-sm bg-white/80 border border-indigo-100 rounded-tl-sm flex items-center gap-2 shadow-sm">
                <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                Analysing live data…
              </div>
            </div>
          )}
        </div>

        <div className="p-3 border-t border-indigo-100 bg-white/70">
          <div className="flex flex-wrap gap-1.5 mb-2">
            {chips.map((c) => (
              <button
                key={c}
                onClick={() => send(c)}
                className="text-[11px] bg-indigo-50 hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 hover:text-white transition-all px-2.5 py-1 rounded-full border border-indigo-100 font-medium"
              >
                {c}
              </button>
            ))}
          </div>

          {pendingImage && (
            <div className="relative mb-2 inline-block">
              <img src={pendingImage} alt="" className="h-20 rounded-lg border border-indigo-200" />
              <button
                onClick={() => setPendingImage(null)}
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-rose-500 text-white flex items-center justify-center"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex gap-2 items-center"
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) setPendingImage(await fileToDataUrl(f));
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="h-11 w-11 shrink-0"
              onClick={() => fileRef.current?.click()}
              title="Attach screenshot"
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about Indian markets…"
              className="flex-1 h-11"
              disabled={postChat.isPending}
              data-testid="chat-input"
            />
            <Button
              type="submit"
              size="icon"
              className="h-11 w-11 shrink-0 bg-gradient-to-br from-indigo-500 to-purple-500"
              disabled={(!input.trim() && !pendingImage) || postChat.isPending}
              data-testid="chat-send"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
