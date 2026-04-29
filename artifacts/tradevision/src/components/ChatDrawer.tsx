import { useState, useRef, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send, Bot, User, Loader2 } from "lucide-react";
import { usePostChat } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

export function ChatDrawer() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    { role: "assistant", content: "Hi. I'm connected to live NSE data. What do you want to know?" }
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const postChat = usePostChat();

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    
    const userMsg = text.trim();
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setInput("");
    
    postChat.mutate({ data: { message: userMsg } }, {
      onSuccess: (data) => {
        setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
      },
      onError: () => {
        setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I encountered an error connecting to the live feed." }]);
      }
    });
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, postChat.isPending]);

  const chips = [
    "What's the VIX saying?",
    "FII flows today?",
    "PCR bias?",
    "Any BUY signals?"
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="icon" className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300">
          <MessageSquare className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col bg-card/95 backdrop-blur-md border-l-border/50">
        <SheetHeader className="p-4 border-b border-border/50 bg-card">
          <SheetTitle className="flex items-center gap-2 text-primary">
            <Bot className="h-5 w-5" />
            TradeVision Assistant
          </SheetTitle>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
          {messages.map((msg, i) => (
            <div key={i} className={cn(
              "flex max-w-[85%]",
              msg.role === "user" ? "ml-auto" : "mr-auto"
            )}>
              <div className={cn(
                "p-3 rounded-2xl text-sm",
                msg.role === "user" 
                  ? "bg-primary text-primary-foreground rounded-tr-sm" 
                  : "bg-muted/50 border border-border/50 rounded-tl-sm"
              )}>
                {msg.content}
              </div>
            </div>
          ))}
          {postChat.isPending && (
            <div className="flex max-w-[85%] mr-auto">
              <div className="p-3 rounded-2xl text-sm bg-muted/50 border border-border/50 rounded-tl-sm flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span>Thinking...</span>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border/50 bg-card/80 backdrop-blur-sm">
          <div className="flex flex-wrap gap-2 mb-3">
            {chips.map(chip => (
              <button
                key={chip}
                onClick={() => handleSend(chip)}
                className="text-[10px] bg-muted hover:bg-primary hover:text-primary-foreground transition-colors px-2 py-1 rounded-full border border-border/50"
              >
                {chip}
              </button>
            ))}
          </div>
          <form 
            onSubmit={e => { e.preventDefault(); handleSend(input); }}
            className="flex gap-2 relative"
          >
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about live markets..."
              className="pr-10 bg-background/50 border-border/50 focus-visible:ring-primary/50"
              disabled={postChat.isPending}
            />
            <Button 
              type="submit" 
              size="icon" 
              className="absolute right-1 top-1 h-8 w-8 rounded-md" 
              disabled={!input.trim() || postChat.isPending}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
