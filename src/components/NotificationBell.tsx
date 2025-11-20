import { Bell } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  // 1. FETCH NOTIFICATIONS ON LOAD
  const fetchNotifications = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // 2. LISTEN FOR REAL-TIME UPDATES
    // This makes the bell ring instantly when a new row is added to the 'notifications' table
    const channel = supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user?.id}` },
        (payload) => {
          setNotifications(prev => [payload.new, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // 3. MARK AS READ WHEN OPENED
  const handleOpenChange = async (open: boolean) => {
    setIsOpen(open);

    if (open && unreadCount > 0) {
        // Update UI instantly (Optimistic Update)
        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        
        // Update Database in background
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('user_id', user?.id)
          .eq('is_read', false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-2 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-background animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b bg-muted/40 flex justify-between items-center">
          <h4 className="font-semibold text-sm">Notifications</h4>
          {unreadCount > 0 && <span className="text-xs text-blue-600 font-medium">Marking as read...</span>}
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No new notifications.
            </div>
          ) : (
            notifications.map((note) => (
              <div 
                key={note.id} 
                className={`p-4 border-b last:border-0 text-sm transition-colors ${
                    !note.is_read ? 'bg-blue-50/50' : 'hover:bg-muted/50'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`font-medium ${!note.is_read ? 'text-blue-700' : ''}`}>
                    {note.title}
                  </span>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                    {format(new Date(note.created_at), "MMM dd")}
                  </span>
                </div>
                <p className="text-muted-foreground text-xs leading-relaxed">
                    {note.message}
                </p>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}