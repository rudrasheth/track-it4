import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function NoticeCarousel() {
  const { user } = useAuth();
  const [notices, setNotices] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotices = async () => {
      if (!user || !user.email) return;

      try {
        // 1. Find Student's Group ID (to show group-specific notices)
        const { data: memberData } = await supabase
          .from('group_members')
          .select('group_id')
          .eq('student_email', user.email)
          .maybeSingle();
        
        const groupId = memberData?.group_id;

        // 2. Build Query: Get notices for this group OR for "all" (null)
        let query = supabase
          .from('notices')
          .select('*')
          .order('created_at', { ascending: false });

        if (groupId) {
          // Syntax: Get notices where group_id is NULL (Global) OR group_id is My Group
          query = query.or(`group_id.is.null,group_id.eq.${groupId}`);
        } else {
          // If student has no group, only show Global notices
          query = query.is('group_id', null);
        }

        const { data, error } = await query;
        
        if (error) throw error;
        setNotices(data || []);

      } catch (error) {
        console.error("Error fetching notices:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotices();
  }, [user]);

  // Navigation Logic
  const next = () => setCurrentIndex((prev) => (prev + 1) % notices.length);
  const prev = () => setCurrentIndex((prev) => (prev - 1 + notices.length) % notices.length);

  // Badge Color Helper
  const getBadgeColor = (type: string) => {
    switch(type) {
      case 'urgent': return "bg-red-500 hover:bg-red-500";
      case 'important': return "bg-orange-500 hover:bg-orange-500";
      default: return "bg-blue-500 hover:bg-blue-500";
    }
  };

  if (loading) return (
    <Card className="h-full flex items-center justify-center min-h-[200px]">
      <p className="text-muted-foreground text-sm">Loading notices...</p>
    </Card>
  );

  if (notices.length === 0) return (
    <Card className="h-full flex flex-col items-center justify-center min-h-[200px] text-center p-4">
      <Bell className="h-8 w-8 text-muted-foreground mb-2 opacity-20" />
      <p className="text-muted-foreground text-sm">No notices at the moment.</p>
    </Card>
  );

  const currentNotice = notices[currentIndex];

  return (
    <Card className="h-full flex flex-col relative overflow-hidden group">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Bell className="h-4 w-4 text-primary" />
          Notice Board
          <Badge className={`ml-auto text-[10px] h-5 ${getBadgeColor(currentNotice.type)} border-none capitalize`}>
            {currentNotice.type || 'Info'}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col justify-between">
        <div>
          <h4 className="font-semibold text-lg line-clamp-1 mb-2">{currentNotice.title}</h4>
          <p className="text-sm text-muted-foreground line-clamp-3 mb-4 min-h-[60px] whitespace-pre-wrap">
            {currentNotice.content}
          </p>
        </div>
        
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {format(new Date(currentNotice.created_at), "MMM dd")}
          </div>
          
          {notices.length > 1 && (
            <div className="flex gap-1">
               <Button variant="outline" size="icon" className="h-6 w-6" onClick={prev}>
                  <ChevronLeft className="h-3 w-3" />
               </Button>
               <Button variant="outline" size="icon" className="h-6 w-6" onClick={next}>
                  <ChevronRight className="h-3 w-3" />
               </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}