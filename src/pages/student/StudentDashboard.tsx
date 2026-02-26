import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { NoticeCarousel } from "@/components/NoticeCarousel";
import { KanbanBoard } from "@/components/KanbanBoard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Upload, Send, AlertCircle, Loader2, CheckCircle, Users, ArrowRight, ClipboardList } from "lucide-react";
import { format, isPast } from "date-fns";
import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, RadialLinearScale, PointElement, LineElement, Tooltip, Legend } from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";
import { supabase } from "@/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { JoinGroupModal } from "@/components/JoinGroupModal";

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, RadialLinearScale, PointElement, LineElement, Tooltip, Legend);

interface Task { id: string; title: string; description: string; due_date: string; status: string; created_by: string; group_id: string; }
interface Submission { id: string; task_id: string; student_id: string; file_name: string; file_url: string; submitted_at: string; grade?: number; }
interface Message { id: string; content: string; sender_id: string; created_at: string; group_id: string; profiles?: { full_name: string }; }
interface Group { id: string; name: string; semester: string; description: string; }

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [messageInput, setMessageInput] = useState("");
  const [leaveGroupOpen, setLeaveGroupOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [myGroup, setMyGroup] = useState<Group | null>(null);
  const [uploadingTaskId, setUploadingTaskId] = useState<string | null>(null);
  const [mentorName, setMentorName] = useState("Mentor");

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !user.email) return;

      try {
        // 1. Find My Group
        const { data: memberData } = await supabase
          .from('group_members')
          .select('group_id, groups(*)')
          .ilike('student_email', user.email)
          .maybeSingle();

        // @ts-ignore
        const myGroupId = memberData?.group_id;
        // @ts-ignore
        if (memberData?.groups) setMyGroup(memberData.groups);

        // 2. Fetch Tasks
        let tasksData: any[] = [];
        if (myGroupId) {
          const { data } = await supabase
            .from('tasks')
            .select('*')
            .eq('group_id', myGroupId)
            .order('due_date', { ascending: true });
          tasksData = data || [];
        }

        // 3. Fetch Submissions
        const { data: subsData } = await supabase.from('submissions').select('*').eq('student_id', user.id);

        // 4. Fetch Mentor Name
        if (tasksData.length > 0 && tasksData[0].created_by) {
          const { data: mentorData } = await supabase.from('profiles').select('full_name').eq('id', tasksData[0].created_by).single();
          if (mentorData) setMentorName(mentorData.full_name);
        }

        setTasks(tasksData);
        setSubmissions(subsData || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  useEffect(() => {
    if (!myGroup?.id) {
      setMessages([]);
      return;
    }

    let active = true;

    const loadMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*, profiles(full_name)')
        .eq('group_id', myGroup.id)
        .order('created_at', { ascending: true });

      if (active) setMessages(data || []);
    };

    loadMessages();

    const channel = supabase
      .channel(`public:messages:group:${myGroup.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `group_id=eq.${myGroup.id}` }, async (payload) => {
        const { data } = await supabase.from('messages').select('*, profiles(full_name)').eq('id', payload.new.id).single();
        if (data) setMessages(prev => [...prev, data]);
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [myGroup?.id]);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  const handleFileUpload = async (taskId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    const file = event.target.files[0];
    setUploadingTaskId(taskId);
    try {
      if (!user) throw new Error("User not found");
      const filePath = `${taskId}/${user.id}/${Date.now()}-${file.name}`;
      await supabase.storage.from('assignments').upload(filePath, file);
      const { data: { publicUrl } } = supabase.storage.from('assignments').getPublicUrl(filePath);
      const { data: newSub } = await supabase.from('submissions').insert({ task_id: taskId, student_id: user.id, file_name: file.name, file_url: publicUrl }).select().single();
      if (newSub) {
        setSubmissions(prev => [...prev.filter(s => s.task_id !== taskId), newSub]);
        toast.success("Assignment submitted!");
      }
    } catch (error: any) { toast.error("Upload failed"); } finally { setUploadingTaskId(null); }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !user || !myGroup?.id) {
      console.log("Message send blocked:", { hasText: messageInput.trim(), hasUser: !!user, hasGroup: !!myGroup?.id });
      return;
    }
    const text = messageInput;
    setMessageInput("");
    try {
      const { error } = await supabase.from('messages').insert({
        content: text,
        sender_id: user.id,
        group_id: myGroup.id
      });
      if (error) {
        console.error("Error sending message:", error);
        toast.error("Failed to send message: " + error.message);
      }
    } catch (err: any) {
      console.error("Exception sending message:", err);
      toast.error("Error sending message");
    }
  };

  const handleLeaveGroup = async () => {
    if (!user?.email) return;
    await supabase.from('group_members').delete().eq('student_email', user.email);
    window.location.reload();
  };

  // Calculations
  const upcomingTasks = tasks.filter((t) => t.status !== "done" && new Date(t.due_date) > new Date()).slice(0, 3);

  const groupTaskIds = new Set(tasks.map(t => t.id));
  const completedTaskIds = new Set(submissions.filter(s => groupTaskIds.has(s.task_id)).map(s => s.task_id));

  const completedCount = completedTaskIds.size;
  const pendingTasksCount = tasks.length - completedCount;
  const progressPercentage = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const progressData = { labels: ["Completed", "Pending"], datasets: [{ data: [progressPercentage, 100 - progressPercentage], backgroundColor: ["#10b981", "#f59e0b"], borderWidth: 0 }] };
  const taskStatusData = { labels: ["To Do", "Submitted"], datasets: [{ label: "Tasks", data: [pendingTasksCount, completedCount], backgroundColor: ["#f59e0b", "#10b981"] }] };

  if (loading) return <div className="flex items-center justify-center h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {myGroup ? `Welcome to ${myGroup.name}` : "Dashboard"}
            </h1>
            <p className="text-muted-foreground flex items-center gap-2 mt-1">
              {myGroup ? (
                <>
                  <Badge variant="secondary" className="font-normal">{myGroup.semester}</Badge>
                  {myGroup.description}
                </>
              ) : (
                "Track your projects and deadlines"
              )}
            </p>
          </div>
          <div className="flex gap-2 items-center">
            {!myGroup && <Button onClick={() => setJoinModalOpen(true)}>Join Group</Button>}
            {myGroup && <Button variant="destructive" size="sm" onClick={() => setLeaveGroupOpen(true)}>Leave Group</Button>}
          </div>
        </div>

        <JoinGroupModal open={joinModalOpen} onOpenChange={setJoinModalOpen} onSuccess={() => window.location.reload()} />

        {!myGroup && (
          <Card className="border-dashed border-2 bg-muted/10">
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <Users className="h-10 w-10 text-muted-foreground mb-3 opacity-50" />
              <h3 className="font-semibold text-lg">No Group Assigned</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-1">You haven't been added to a group yet. Ask your mentor via email or use a Join Code.</p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-3 xl:grid-cols-4">
          <div className="lg:col-span-2 xl:col-span-3 space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <NoticeCarousel />
              <Card>
                <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><Calendar className="h-4 w-4 text-primary" /> Upcoming Deadlines</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {upcomingTasks.length === 0 && <p className="text-sm text-muted-foreground">No upcoming tasks.</p>}
                  {upcomingTasks.map((task) => (
                    <div key={task.id} className="flex items-start justify-between"><div className="flex-1"><p className="text-sm font-medium">{task.title}</p><p className="text-xs text-muted-foreground">{format(new Date(task.due_date), "MMM dd")}</p></div></div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card><CardHeader><CardTitle>Your Project Progress</CardTitle></CardHeader><CardContent><div className="grid gap-6 md:grid-cols-2"><div className="h-64 flex justify-center"><Doughnut data={progressData} options={{ responsive: true, maintainAspectRatio: false }} /></div><div className="h-64 flex justify-center"><Bar data={taskStatusData} options={{ responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }} /></div></div></CardContent></Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-3 border-b border-border/50 mb-3"><CardTitle className="flex items-center gap-2 text-base"><ClipboardList className="h-4 w-4 text-primary" /> Recent Activity</CardTitle></CardHeader>
              <CardContent className="space-y-0 p-0 pb-2 flex-1 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto px-6 py-2 space-y-4 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent min-h-[400px]">
                  {tasks.length === 0 && <p className="text-sm text-muted-foreground py-2 text-center">No recent activity.</p>}
                  {tasks.map((task, index) => {
                    const isSubmitted = completedTaskIds.has(task.id);
                    return (
                      <div key={task.id} className="flex items-center justify-between relative group">
                        <div className="flex items-center gap-3 w-full pr-4">
                          <span className="text-xs font-semibold text-muted-foreground w-4">{index + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{task.title}</p>
                            <p className="text-[10px] text-muted-foreground">Due {format(new Date(task.due_date), "MMM dd")}</p>
                          </div>
                        </div>
                        <Badge variant={isSubmitted ? "default" : "outline"} className={isSubmitted ? "bg-green-500/10 text-green-600 hover:bg-green-500/20 shadow-none border-0" : "text-amber-600 border-amber-200 bg-amber-50 shadow-none"}>
                          {isSubmitted ? "Submitted" : "Pending"}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs defaultValue="kanban" className="space-y-4">
          <TabsList>
            <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
          </TabsList>

          <TabsContent value="kanban">
            {myGroup ? <KanbanBoard groupId={myGroup.id} /> : <div className="p-10 text-center text-muted-foreground">Join a group to see the board.</div>}
          </TabsContent>
        </Tabs>

        {/* Group Chat - Below Kanban */}
        {myGroup && (
          <Card className="h-[500px] flex flex-col">
            <CardHeader>
              <CardTitle>Group Chat</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                {messages.length === 0 && <div className="text-center text-muted-foreground mt-10">No messages yet.</div>}
                {messages.map((msg) => {
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
                })}
              </div>
              <div className="p-4 bg-white border-t flex gap-2">
                <Input
                  placeholder="Type message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                />
                <Button size="icon" onClick={handleSendMessage} disabled={!messageInput.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

      </div>
      <AlertDialog open={leaveGroupOpen} onOpenChange={setLeaveGroupOpen}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Leave Group?</AlertDialogTitle></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleLeaveGroup}>Confirm</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}