import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

export default function MentorGroupChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Fetch initial history
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*, profiles(full_name)')
        .order('created_at', { ascending: true });
      
      if (data) setMessages(data);
      setLoading(false);
    };

    fetchMessages();

    // 2. Real-time Subscription
    const channel = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
         // Fetch user name for the new message
         const { data: userData } = await supabase.from('profiles').select('full_name').eq('id', payload.new.sender_id).single();
         const msgWithUser = { ...payload.new, profiles: userData };
         setMessages((prev) => [...prev, msgWithUser]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user) return;
    const text = newMessage;
    setNewMessage(""); // Clear input immediately for better UX

    await supabase.from('messages').insert({
        content: text,
        sender_id: user.id
    });
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-100px)] flex flex-col">
        <Card className="flex-1 flex flex-col shadow-lg">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
               Global Group Chat
            </CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            {/* Messages Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
              {loading ? (
                <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-muted-foreground" /></div>
              ) : messages.length === 0 ? (
                <div className="text-center text-muted-foreground mt-10">No messages yet. Say hello!</div>
              ) : (
                messages.map((msg) => {
                    const isMe = msg.sender_id === user?.id;
                    return (
                        <div key={msg.id} className={`flex gap-3 ${isMe ? "flex-row-reverse" : ""}`}>
                            <Avatar className="h-8 w-8 border">
                                <AvatarFallback className={isMe ? "bg-primary text-primary-foreground" : ""}>
                                    {msg.profiles?.full_name?.[0] || "?"}
                                </AvatarFallback>
                            </Avatar>
                            <div className={`max-w-[70%] rounded-lg p-3 text-sm ${isMe ? "bg-primary text-primary-foreground" : "bg-white border shadow-sm"}`}>
                                {!isMe && <p className="text-[10px] opacity-70 mb-1 font-bold">{msg.profiles?.full_name}</p>}
                                <p>{msg.content}</p>
                                <p className={`text-[10px] mt-1 text-right ${isMe ? "opacity-70" : "text-muted-foreground"}`}>
                                    {format(new Date(msg.created_at), "HH:mm")}
                                </p>
                            </div>
                        </div>
                    );
                })
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t flex gap-2">
              <Input 
                placeholder="Type a message..." 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                className="flex-1"
              />
              <Button size="icon" onClick={handleSend} disabled={!newMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}