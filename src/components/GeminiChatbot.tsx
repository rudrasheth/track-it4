import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Loader2, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { toast } from "sonner";

interface ChatMessage {
  id: string;
  content: string;
  sender: "user" | "bot";
  timestamp: Date;
}

interface GeminiChatbotProps {
  groupName?: string;
}

export function GeminiChatbot({ groupName = "Group" }: GeminiChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      content: `Hi! I'm your AI assistant for ${groupName}. Ask me anything about your assignments, deadlines, or group tasks!`,
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
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
            model: "llama3-8b-8192",
            messages: [
              ...messages.map((m) => ({
                role: m.sender === "user" ? "user" : "assistant",
                content: m.content,
              })),
              {
                role: "user",
                content: userMessage,
              },
            ],
            temperature: 0.7,
            max_tokens: 1024,
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
        content:
          "Sorry, I encountered an error. Please try again. Error: " +
          error.message,
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="h-[500px] flex flex-col mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-yellow-500" />
          AI Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50"
        >
          {messages.map((msg) => {
            const isBot = msg.sender === "bot";
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isBot ? "" : "flex-row-reverse"}`}
              >
                <Avatar className="h-8 w-8 border">
                  <AvatarFallback
                    className={
                      isBot ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground"
                    }
                  >
                    {isBot ? "AI" : "Me"}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`max-w-[70%] rounded-lg p-3 text-sm ${isBot
                    ? "bg-white border shadow-sm"
                    : "bg-primary text-primary-foreground"
                    }`}
                >
                  <p>{msg.content}</p>
                  <p
                    className={`text-[10px] mt-1 text-right ${isBot ? "text-muted-foreground" : "opacity-70"
                      }`}
                  >
                    {format(msg.timestamp, "HH:mm")}
                  </p>
                </div>
              </div>
            );
          })}
          {loading && (
            <div className="flex gap-3">
              <Avatar className="h-8 w-8 border">
                <AvatarFallback className="bg-accent text-accent-foreground">
                  AI
                </AvatarFallback>
              </Avatar>
              <div className="bg-white border rounded-lg p-3 shadow-sm">
                <Loader2 className="h-5 w-5 animate-spin text-yellow-500" />
              </div>
            </div>
          )}
        </div>
        <div className="p-4 bg-white border-t flex gap-2">
          <Input
            placeholder="Ask me anything..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) =>
              e.key === "Enter" && !loading && handleSendMessage()
            }
            disabled={loading}
          />
          <Button
            size="icon"
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || loading}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
