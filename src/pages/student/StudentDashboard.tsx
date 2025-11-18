import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { NoticeCarousel } from "@/components/NoticeCarousel";
import { KanbanBoard } from "@/components/KanbanBoard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, FileText, Send, Upload, AlertCircle, Loader2, CheckCircle, Users } from "lucide-react";
import { format, isPast } from "date-fns";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner"; 
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, RadialLinearScale, PointElement, LineElement, Tooltip, Legend } from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";
import { supabase } from "@/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, RadialLinearScale, PointElement, LineElement, Tooltip, Legend);

interface Task {
  id: string;
  title: string;
  description: string;
  due_date: string;
  status: string;
  created_by: string; 
}

interface Submission {
  id: string;
  task_id: string;
  student_id: string;
  file_name: string;
  file_url: string;
  submitted_at: string;
  grade?: number;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  profiles?: { full_name: string };
}

interface Group {
  id: string;
  name: string;
  semester: string;
  description: string;
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [messageInput, setMessageInput] = useState("");
  const [leaveGroupOpen, setLeaveGroupOpen] = useState(false);

  // --- REAL STATE ---
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [myGroup, setMyGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingTaskId, setUploadingTaskId] = useState<string | null>(null);
  const [mentorName, setMentorName] = useState("Mentor");

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // 1. Fetch Tasks
        const { data: tasksData } = await supabase
          .from('tasks')
          .select('*')
          .order('due_date', { ascending: true });

        // 2. Fetch Submissions
        const { data: subsData } = await supabase
          .from('submissions')
          .select('*')
          .eq('student_id', user.id);

        // 3. Fetch Chat Messages
        const { data: msgData } = await supabase
          .from('messages')
          .select('*, profiles(full_name)')
          .order('created_at', { ascending: true });
          
        // 4. Fetch Mentor Name
        if (tasksData && tasksData.length > 0 && tasksData[0].created_by) {
           const { data: mentorData } = await supabase
             .from('profiles')
             .select('full_name')
             .eq('id', tasksData[0].created_by)
             .single();
           if (mentorData) setMentorName(mentorData.full_name);
        }

        // 5. Fetch My Group (Using Email)
        if (user.email) {
            const { data: memberData } = await supabase
                .from('group_members')
                .select('groups(*)')
                .eq('student_email', user.email)
                .maybeSingle();
            
            if (memberData?.groups) {
                // @ts-ignore
                setMyGroup(memberData.groups);
            }
        }

        setTasks(tasksData || []);
        setSubmissions(subsData || []);
        setMessages(msgData || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Subscribe to chat
    const msgSubscription = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
         supabase.from('messages').select('*, profiles(full_name)').eq('id', payload.new.id).single()
         .then(({ data }) => {
            if(data) setMessages(prev => [...prev, data]);
         });
      })
      .subscribe();

    return () => { supabase.removeChannel(msgSubscription); };

  }, [user]);

  const handleFileUpload = async (taskId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    const file = event.target.files[0];
    setUploadingTaskId(taskId);

    try {
      if (!user) throw new Error("User not found");
      const filePath = `${taskId}/${user.id}/${Date.now()}-${file.name}`;
      
      await supabase.storage.from('assignments').upload(filePath, file);
      const { data: { publicUrl } } = supabase.storage.from('assignments').getPublicUrl(filePath);

      const { data: newSub } = await supabase
        .from('submissions')
        .insert({ task_id: taskId, student_id: user.id, file_name: file.name, file_url: publicUrl })
        .select().single();

      if (newSub) {
         setSubmissions(prev => [...prev.filter(s => s.task_id !== taskId), newSub]);
         toast.success("Assignment submitted!");
      }
    } catch (error: any) {
      toast.error("Upload failed");
    } finally {
      setUploadingTaskId(null);
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !user) return;
    await supabase.from('messages').insert({ content: messageInput, sender_id: user.id });
    setMessageInput("");
  };

  // Calcs
  const upcomingTasks = tasks.filter((t) => t.status !== "done" && new Date(t.due_date) > new Date()).slice(0, 3);
  const pendingTasksCount = tasks.length - submissions.length;
  const progressPercentage = Math.round((submissions.length / (tasks.length || 1)) * 100);
  const progressData = {
    labels: ["Completed", "Pending"],
    datasets: [{ data: [progressPercentage, 100 - progressPercentage], backgroundColor: ["#10b981", "#f59e0b"], borderWidth: 0 }]
  };
  const taskStatusData = {
    labels: ["To Do", "Submitted"],
    datasets: [{ label: "Tasks", data: [tasks.length - submissions.length, submissions.length], backgroundColor: ["#3b82f6", "#f59e0b"] }]
  };

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Track your projects and deadlines</p>
          </div>
          {myGroup && (
             <Button variant="destructive" size="sm" onClick={() => setLeaveGroupOpen(true)}>Leave Group</Button>
          )}
        </div>

        {/* MY GROUP CARD */}
        {myGroup ? (
            <Card className="bg-primary/5 border-primary/20">
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Users className="h-5 w-5 text-primary" />
                        {myGroup.name}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                        <Badge variant="secondary">{myGroup.semester}</Badge>
                        <span>{myGroup.description}</span>
                    </div>
                </CardContent>
            </Card>
        ) : (
            <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-6 text-center">
                    <Users className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">You are not in a group yet.</p>
                    <p className="text-xs text-muted-foreground">Ask your mentor to add you by email.</p>
                </CardContent>
            </Card>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <NoticeCarousel />
          <Card>
            <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><Calendar className="h-4 w-4 text-primary" /> Upcoming Deadlines</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {upcomingTasks.map((task) => (
                <div key={task.id} className="flex items-start justify-between">
                  <div className="flex-1"><p className="text-sm font-medium">{task.title}</p><p className="text-xs text-muted-foreground">{format(new Date(task.due_date), "MMM dd")}</p></div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><Clock className="h-4 w-4 text-warning" /> Quick Stats</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><p className="text-2xl font-bold">{pendingTasksCount}</p><p className="text-xs text-muted-foreground">Pending Tasks</p></div>
              <div><p className="text-2xl font-bold">{submissions.length}</p><p className="text-xs text-muted-foreground">Total Submissions</p></div>
            </CardContent>
          </Card>
        </div>

        {/* Tasks List */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Tasks Assigned</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tasks.map((task) => {
              const isOverdue = isPast(new Date(task.due_date)) && task.status !== "done";
              const isSubmitted = submissions.some(s => s.task_id === task.id);
              return (
                <Card key={task.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">{task.title}</CardTitle>
                      {isSubmitted && <CheckCircle className="h-5 w-5 text-green-500" />}
                    </div>
                    <p className="text-xs text-muted-foreground">by {mentorName}</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                     <div className="flex items-center gap-2 text-sm"><Calendar className="h-4 w-4 text-muted-foreground" /><span>{format(new Date(task.due_date), "MMM dd")}</span></div>
                    <div className="w-full">
                        <input type="file" id={`file-${task.id}`} className="hidden" onChange={(e) => handleFileUpload(task.id, e)} disabled={uploadingTaskId === task.id} />
                      <label htmlFor={`file-${task.id}`}>
                        <div className="w-full cursor-pointer">
                          <Button variant={isSubmitted ? "outline" : "default"} className={`w-full pointer-events-none ${isSubmitted ? "border-green-600 text-green-600" : ""}`} size="sm" disabled={uploadingTaskId === task.id}>
                            {uploadingTaskId === task.id ? <Loader2 className="h-4 w-4 animate-spin" /> : isSubmitted ? "Edit Submission" : "Upload Assignment"}
                          </Button>
                        </div>
                      </label>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <Card>
          <CardHeader><CardTitle>Your Project Progress</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="h-64 flex justify-center"><Doughnut data={progressData} options={{ responsive: true, maintainAspectRatio: false }} /></div>
              <div className="h-64 flex justify-center"><Bar data={taskStatusData} options={{ responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }} /></div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="chat" className="space-y-4">
          <TabsList><TabsTrigger value="chat">Group Chat</TabsTrigger><TabsTrigger value="submissions">History</TabsTrigger></TabsList>
          <TabsContent value="chat">
            <Card className="h-[500px] flex flex-col">
              <CardHeader><CardTitle>Group Chat</CardTitle></CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="flex-1 space-y-4 overflow-y-auto mb-4 p-2">
                  {messages.map((msg) => (
                    <div key={msg.id} className="flex items-start gap-3">
                       <Avatar className="h-8 w-8"><AvatarFallback>{msg.profiles?.full_name?.[0] || "?"}</AvatarFallback></Avatar>
                       <div><div className="flex items-center gap-2"><span className="text-sm font-semibold">{msg.profiles?.full_name || "Unknown"}</span><span className="text-xs text-muted-foreground">{format(new Date(msg.created_at), "HH:mm")}</span></div><p className="text-sm text-muted-foreground">{msg.content}</p></div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2"><Input placeholder="Type message..." value={messageInput} onChange={(e) => setMessageInput(e.target.value)} onKeyPress={(e) => e.key === "Enter" && handleSendMessage()} /><Button size="icon" onClick={handleSendMessage}><Send className="h-4 w-4" /></Button></div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="submissions">
            <Card><CardContent><Table><TableHeader><TableRow><TableHead>Task</TableHead><TableHead>File</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                  <TableBody>{submissions.map((sub) => { const t = tasks.find(x => x.id === sub.task_id); return (<TableRow key={sub.id}><TableCell>{t?.title}</TableCell><TableCell><a href={sub.file_url} target="_blank" className="text-blue-600 hover:underline">{sub.file_name}</a></TableCell><TableCell>{format(new Date(sub.submitted_at), "MMM dd")}</TableCell></TableRow>)})}</TableBody>
                </Table></CardContent></Card>
          </TabsContent>
        </Tabs>
      </div>
      <AlertDialog open={leaveGroupOpen} onOpenChange={setLeaveGroupOpen}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Leave Group?</AlertDialogTitle></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction>Confirm</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}