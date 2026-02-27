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
import { cn } from "@/lib/utils";
import { supabase } from "@/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { JoinGroupModal } from "@/components/JoinGroupModal";

import CalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";
import { Tooltip as ReactTooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";

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

  const currentSemNum = parseInt(myGroup?.semester?.replace(/[^0-9]/g, '') || "1");
  const semestersList = Array.from({ length: 8 }).map((_, i) => {
    const semNum = i + 1;
    let status = "upcoming";
    if (semNum < currentSemNum) status = "completed";
    else if (semNum === currentSemNum) status = "current";
    return {
      id: semNum,
      name: `Semester ${semNum}`,
      status,
      date: `Year ${Math.ceil(semNum / 2)}`
    };
  });
  const completedSemsCount = semestersList.filter(s => s.status === "completed").length;
  const inProgressSemsCount = semestersList.filter(s => s.status === "current").length;
  const semProgressPercentage = Math.round((completedSemsCount / 8) * 100);

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
                <Badge variant="secondary" className="font-normal">{myGroup.semester}</Badge>
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
              <Card className="flex flex-col">
                <CardHeader className="pb-2 pt-4"><CardTitle className="flex items-center gap-2 text-base"><Calendar className="h-4 w-4 text-primary" /> Upcoming Deadlines</CardTitle></CardHeader>
                <CardContent className="space-y-2 pb-4 flex-1">
                  {upcomingTasks.length === 0 && <p className="text-sm text-muted-foreground mt-2">No upcoming tasks.</p>}
                  {upcomingTasks.map((task) => (
                    <div key={task.id} className="flex items-start justify-between"><div className="flex-1"><p className="text-sm font-medium leading-none mb-1">{task.title}</p><p className="text-xs text-muted-foreground">{format(new Date(task.due_date), "MMM dd")}</p></div></div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Academic Timeline</CardTitle>
                <p className="text-sm text-muted-foreground">Degree progress semester by semester</p>
              </CardHeader>
              <CardContent>
                <div className="grid gap-8 md:grid-cols-3 items-center">
                  <div className="md:col-span-1 flex flex-col items-center justify-center py-2">
                    <div className="relative w-40 h-40 flex items-center justify-center rounded-full bg-muted/20 border-8 border-muted">
                      <svg className="absolute top-0 left-0 w-full h-full transform -rotate-90">
                        <circle
                          cx="80"
                          cy="80"
                          r="72"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          className="text-primary"
                          strokeDasharray={`${semProgressPercentage * 4.5} 450`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="text-center">
                        <span className="text-3xl font-bold">{semProgressPercentage}%</span>
                        <p className="text-xs text-muted-foreground mt-1">Completed</p>
                      </div>
                    </div>
                    <div className="flex justify-center gap-4 mt-6 w-full text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-primary" />
                        <span>{completedSemsCount} Done</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-amber-500" />
                        <span>{inProgressSemsCount} Curr</span>
                      </div>
                    </div>
                  </div>
                  <div className="md:col-span-2 border-l border-border pl-8 space-y-6 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                    {semestersList.map((sem) => {
                      const isCompleted = sem.status === "completed";
                      const isCurrent = sem.status === "current";
                      return (
                        <div key={sem.id} className="relative">
                          <div className={cn(
                            "absolute -left-[38px] top-1.5 h-3 w-3 rounded-full border-2 bg-background",
                            isCompleted ? "border-primary bg-primary" : (isCurrent ? "border-amber-500" : "border-muted-foreground")
                          )} />
                          <div>
                            <p className={cn("text-sm font-medium", !isCompleted && !isCurrent && "text-muted-foreground")}>{sem.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className={
                                isCompleted ? "bg-primary/10 text-primary border-primary/20" :
                                  (isCurrent ? "text-amber-600 border-amber-600/50 bg-amber-50" : "text-muted-foreground border-border bg-muted/20")
                              }>
                                {isCompleted ? "Completed" : (isCurrent ? "In Progress" : "Upcoming")}
                              </Badge>
                              <span className="text-xs text-muted-foreground">{sem.date}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-3 border-b border-border/50 mb-3"><CardTitle className="flex items-center gap-2 text-base"><ClipboardList className="h-4 w-4 text-primary" /> Recent Activity</CardTitle></CardHeader>
              <CardContent className="space-y-0 p-0 pb-2 flex-1 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto px-6 py-2 space-y-4 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
                  {tasks.length === 0 && <p className="text-sm text-muted-foreground py-2 text-center">No recent activity.</p>}
                  {tasks.map((task, index) => {
                    const isSubmitted = completedTaskIds.has(task.id);
                    return (
                      <div
                        key={task.id}
                        className="flex items-center justify-between relative group cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/50 p-2 rounded-md transition-colors"
                        onClick={() => navigate('/student/submissions')}
                      >
                        <div className="flex items-center gap-3 w-full pr-4">
                          <span className="text-xs font-semibold text-muted-foreground w-4">{index + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{task.title}</p>
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

        {/* Heat Map Section above Kanban */}
        <Card className="mb-6">
          <CardHeader className="pb-2 relative">
            <CardTitle>Activity Heatmap</CardTitle>
            <p className="text-sm text-muted-foreground">Your recent submissions & task deadlines</p>
          </CardHeader>
          <CardContent className="overflow-x-auto pb-6">
            <div className="min-w-[700px] mt-2">
              <CalendarHeatmap
                startDate={new Date(new Date().setFullYear(new Date().getFullYear() - 1))}
                endDate={new Date()}
                values={
                  // Generate heatmap using real tasks and submissions data
                  [...Array.from({ length: 365 }).map((_, i) => {
                    const date = new Date();
                    date.setDate(date.getDate() - i);
                    const matchStr = format(date, 'yyyy-MM-dd');
                    let count = 0;
                    let dueCount = 0;

                    tasks.forEach(t => {
                      if (t.due_date && t.due_date.startsWith(matchStr)) dueCount++;
                    });

                    submissions.forEach(s => {
                      if (s.submitted_at && s.submitted_at.startsWith(matchStr)) count++;
                    });

                    const isTaskDue = dueCount > 0;

                    return {
                      date: matchStr,
                      count: isTaskDue ? 0 : count, // Zero out count if due, to use blue css
                      actualCount: count, // Store real count for tooltip
                      isDue: isTaskDue,
                      dueCount: dueCount
                    };
                  })]
                }
                classForValue={(value) => {
                  if (!value) return 'color-empty';
                  if (value.isDue) return 'color-scale-blue'; // custom blue tag
                  if (value.count > 0) return `color-scale-${Math.min(value.count, 4)}`;
                  return 'color-empty';
                }}
                tooltipDataAttrs={(value: any) => {
                  if (!value || (!value.date)) return {};
                  let tooltipContent = "";
                  if (value.isDue) {
                    tooltipContent = `${value.dueCount} task(s) due on ${value.date}`;
                    if (value.actualCount > 0) tooltipContent += ` (${value.actualCount} submissions)`;
                  } else if (value.actualCount > 0) {
                    tooltipContent = `${value.actualCount} submissions on ${value.date}`;
                  } else {
                    tooltipContent = `No activity on ${value.date}`;
                  }

                  return {
                    'data-tooltip-id': 'heatmap-tooltip',
                    'data-tooltip-content': tooltipContent,
                  };
                }}
                showWeekdayLabels={true}
              />
              <ReactTooltip id="heatmap-tooltip" />

              <style>{`
                    .react-calendar-heatmap .color-empty { fill: #ebedf0; }
                    .react-calendar-heatmap .color-scale-1 { fill: #9be9a8; }
                    .react-calendar-heatmap .color-scale-2 { fill: #40c463; }
                    .react-calendar-heatmap .color-scale-3 { fill: #30a14e; }
                    .react-calendar-heatmap .color-scale-4 { fill: #216e39; }
                    .react-calendar-heatmap .color-scale-blue { fill: #3b82f6; } /* Tailwind blue-500 for due dates */
                    .dark .react-calendar-heatmap .color-empty { fill: #1f2937; }
                    .dark .react-calendar-heatmap .color-scale-1 { fill: #0e4429; }
                    .dark .react-calendar-heatmap .color-scale-2 { fill: #006d32; }
                    .dark .react-calendar-heatmap .color-scale-3 { fill: #26a641; }
                    .dark .react-calendar-heatmap .color-scale-4 { fill: #39d353; }
                    .react-calendar-heatmap text { font-size: 8px; fill: #9ca3af; }
                  `}</style>
            </div>
          </CardContent>
        </Card>

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
    </DashboardLayout >
  );
}