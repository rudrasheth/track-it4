import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Loader2, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { toast } from "sonner";

interface ChatMessage {
  id: string;
  content: string;
  sender: "user" | "bot";
  timestamp: Date;
}

export function SidebarGeminiBot() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      content: "Hi! Ask me anything about your tasks, assignments, or group work!",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const apiKey = import.meta.env.VITE_GROQ_API_KEY;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) {
      return;
    }

    const userMessage = inputValue;
    setInputValue("");

    const newUserMessage: ChatMessage = {
      id: Date.now().toString(),
      content: userMessage,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newUserMessage]);
    setLoading(true);

    try {
      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              {
                role: "system",
                content: "You are a helpful AI assistant for a student platform.",
              },
              ...messages.filter(m => m.id !== "1").map((m) => ({
                role: m.sender === "user" ? "user" : "assistant",
                content: m.content,
              })),
              {
                role: "user",
                content: userMessage,
              },
            ],
            temperature: 0.7,
            max_tokens: 500,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get response from AI");
      }

      const data = await response.json();
      const botResponse = data.choices?.[0]?.message?.content || "Sorry, I couldn't generate a response.";

      const newBotMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: botResponse,
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, newBotMessage]);
    } catch (error: any) {
      console.error("AI API error:", error);
      toast.error("Error: " + error.message);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I encountered an error. Please try again.",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80">
      <Card className="shadow-lg">
        <CardHeader className="pb-3 cursor-pointer bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-t-lg" onClick={() => setExpanded(!expanded)}>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base text-primary-foreground">
              <Sparkles className="h-4 w-4" />
              AI Assistant
            </CardTitle>
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </div>
        </CardHeader>

        {expanded && (
          <CardContent className="flex flex-col p-0 h-96">
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50/50"
            >
              {messages.map((msg) => {
                const isBot = msg.sender === "bot";
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-2 ${isBot ? "" : "flex-row-reverse"}`}
                  >
                    <Avatar className="h-6 w-6 border">
                      <AvatarFallback
                        className={`text-xs ${isBot ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground"
                          }`}
                      >
                        {isBot ? "AI" : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`max-w-[70%] rounded-lg p-2 text-xs ${isBot
                        ? "bg-white border shadow-sm"
                        : "bg-primary text-primary-foreground"
                        }`}
                    >
                      <p>{msg.content}</p>
                    </div>
                  </div>
                );
              })}
              {loading && (
                <div className="flex gap-2">
                  <Avatar className="h-6 w-6 border">
                    <AvatarFallback className="bg-accent text-accent-foreground text-xs">
                      AI
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-white border rounded-lg p-2 shadow-sm">
                    <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
                  </div>
                </div>
              )}
            </div>
            <div className="p-3 bg-white border-t flex gap-2">
              <Input
                placeholder="Ask..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" && !loading && handleSendMessage()
                }
                disabled={loading}
                className="text-xs h-8"
              />
              <Button
                size="sm"
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || loading}
                className="h-8 w-8 p-0"
              >
                <Send className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
