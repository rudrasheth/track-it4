import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Bell, Loader2, Users, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { supabase } from "@/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function Notices() {
  const { user } = useAuth();
  const [notices, setNotices] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form State
  const [newNotice, setNewNotice] = useState({ 
    title: "", 
    content: "", 
    group_id: "all", 
    type: "info" 
  });

  // 1. Fetch Data
  const fetchData = async () => {
    if (!user) return;
    try {
      // Get Notices
      const { data: noticeData } = await supabase
        .from('notices')
        .select(`*, groups(name)`)
        .order('created_at', { ascending: false });
      
      // Get Mentor's Groups (for the dropdown)
      const { data: groupData } = await supabase
        .from('groups')
        .select('id, name')
        .eq('created_by', user.id);

      setNotices(noticeData || []);
      setGroups(groupData || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [user]);

  // 2. Create Notice
  const handleCreate = async () => {
    if (!newNotice.title || !newNotice.content) {
      toast.error("Please add a title and content");
      return;
    }
    setCreating(true);
    
    try {
      const payload: any = {
        title: newNotice.title,
        content: newNotice.content,
        type: newNotice.type,
        created_by: user?.id
      };

      // Only add group_id if it's not "all"
      if (newNotice.group_id !== "all") {
        payload.group_id = newNotice.group_id;
      }

      const { error } = await supabase.from('notices').insert(payload);
      if (error) throw error;

      toast.success("Notice posted successfully!");
      setNewNotice({ title: "", content: "", group_id: "all", type: "info" });
      setIsOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Failed to post notice");
    } finally {
      setCreating(false);
    }
  };

  // 3. Delete Notice
  const handleDelete = async (id: string) => {
    if(!confirm("Delete this notice?")) return;
    await supabase.from('notices').delete().eq('id', id);
    fetchData();
    toast.success("Notice deleted");
  };

  // Helper for Badge Colors
  const getBadgeColor = (type: string) => {
    switch(type) {
      case 'urgent': return "bg-red-500 hover:bg-red-600";
      case 'important': return "bg-orange-500 hover:bg-orange-600";
      default: return "bg-blue-500 hover:bg-blue-600";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Notices Board</h1>
            <p className="text-muted-foreground">Announcements for your project groups</p>
          </div>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> Post Notice</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader><DialogTitle>Create New Notice</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4">
                    
                    <div className="grid gap-2">
                        <Label>Title</Label>
                        <Input placeholder="e.g. Meeting Rescheduled" value={newNotice.title} onChange={(e) => setNewNotice({...newNotice, title: e.target.value})} />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Target Group</Label>
                            <Select value={newNotice.group_id} onValueChange={(v) => setNewNotice({...newNotice, group_id: v})}>
                                <SelectTrigger><SelectValue placeholder="Select Group" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Groups</SelectItem>
                                    {groups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Priority</Label>
                            <Select value={newNotice.type} onValueChange={(v) => setNewNotice({...newNotice, type: v})}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="info">General Info</SelectItem>
                                    <SelectItem value="important">Important</SelectItem>
                                    <SelectItem value="urgent">Urgent</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Details</Label>
                        <Textarea placeholder="Type your message here..." className="min-h-[100px]" value={newNotice.content} onChange={(e) => setNewNotice({...newNotice, content: e.target.value})} />
                    </div>

                </div>
                <DialogFooter>
                    <Button onClick={handleCreate} disabled={creating}>
                        {creating ? <Loader2 className="animate-spin mr-2" /> : "Post Notice"}
                    </Button>
                </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? <div className="text-center p-10"><Loader2 className="animate-spin h-8 w-8 mx-auto text-primary" /></div> : (
            <div className="grid gap-4">
                {notices.length === 0 && (
                    <div className="text-center text-muted-foreground p-10 border rounded-lg border-dashed">
                        <Bell className="h-10 w-10 mx-auto mb-2 opacity-20" />
                        No notices posted yet.
                    </div>
                )}
                
                {notices.map((notice) => (
                    <Card key={notice.id} className="relative group hover:shadow-md transition-shadow border-l-4" style={{ borderLeftColor: notice.type === 'urgent' ? '#ef4444' : notice.type === 'important' ? '#f97316' : '#3b82f6' }}>
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        {notice.title}
                                        <Badge className={`${getBadgeColor(notice.type)} capitalize border-none`}>
                                            {notice.type}
                                        </Badge>
                                    </CardTitle>
                                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                        <span>{format(new Date(notice.created_at), "MMM dd, yyyy • HH:mm")}</span>
                                        <span>|</span>
                                        <span className="flex items-center gap-1">
                                            <Users className="h-3 w-3" /> 
                                            {notice.groups?.name || "All Groups"}
                                        </span>
                                    </div>
                                </div>
                                {notice.created_by === user?.id && (
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100" onClick={() => handleDelete(notice.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
                                {notice.content}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        )}
      </div>
    </DashboardLayout>
  );
}