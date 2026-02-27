import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Loader2, CheckCircle, Clock, Calendar as CalendarIcon } from "lucide-react";
import { format, isPast } from "date-fns";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function StudentSubmissions() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const currentTab = location.pathname.split('/').pop() || "all";

  const [submissions, setSubmissions] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        // Fetch submissions
        const { data: subData } = await supabase
          .from('submissions')
          .select(`*, tasks ( title, due_date )`)
          .eq('student_id', user.id)
          .order('submitted_at', { ascending: false });

        setSubmissions(subData || []);

        // Fetch user's group to get all tasks
        const { data: memberData } = await supabase
          .from('group_members')
          .select('group_id')
          .ilike('student_email', user.email)
          .maybeSingle();

        if (memberData?.group_id) {
          const { data: tasksData } = await supabase
            .from('tasks')
            .select('*')
            .eq('group_id', memberData.group_id)
            .order('due_date', { ascending: true });

          setTasks(tasksData || []);
        }

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const submittedTaskIds = new Set(submissions.map(s => s.task_id));

  // Pending tasks: not submitted and due date is in the past or very close
  const pendingTasks = tasks.filter(t => !submittedTaskIds.has(t.id) && isPast(new Date(t.due_date)));

  // Upcoming tasks: not submitted and due date is in the future
  const upcomingTasks = tasks.filter(t => !submittedTaskIds.has(t.id) && !isPast(new Date(t.due_date)));

  const handleTabChange = (val: string) => {
    navigate(`/student/submissions${val === 'all' ? '' : `/${val}`}`);
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">My Submissions</h1>
            <p className="text-muted-foreground">Manage your completed, pending, and upcoming workload.</p>
          </div>
        </div>

        <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-4">
          <TabsList className="bg-background border h-12 w-full justify-start overflow-x-auto rounded-lg px-2">
            <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">All Overview</TabsTrigger>
            <TabsTrigger value="completed" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">Completed</TabsTrigger>
            <TabsTrigger value="pending" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white">Pending</TabsTrigger>
            <TabsTrigger value="upcoming" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">Upcoming</TabsTrigger>
          </TabsList>

          {/* ALL/COMPLETED VIEW */}
          {(currentTab === "all" || currentTab === "completed" || currentTab === "submissions") && (
            <Card className="border-green-100">
              <CardHeader className="bg-green-50/50">
                <CardTitle className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-500" /> Completed Features & Submissions</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task Name</TableHead>
                      <TableHead>File Name</TableHead>
                      <TableHead>Submitted On</TableHead>
                      <TableHead>Feedback</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                          No completed submissions yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      submissions.map((sub) => (
                        <TableRow key={sub.id}>
                          <TableCell className="font-medium">{sub.tasks?.title || "Unknown Task"}</TableCell>
                          <TableCell>{sub.file_name}</TableCell>
                          <TableCell>{format(new Date(sub.submitted_at), "MMM dd, yyyy")}</TableCell>
                          <TableCell className="max-w-[200px] truncate" title={sub.feedback}>
                            {sub.feedback || "-"}
                          </TableCell>
                          <TableCell>
                            <a href={sub.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-600 hover:underline">
                              View <ExternalLink className="h-3 w-3 ml-1" />
                            </a>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* PENDING VIEW */}
          {(currentTab === "all" || currentTab === "pending") && (
            <Card className="border-amber-100">
              <CardHeader className="bg-amber-50/50">
                <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-amber-500" /> Pending/Overdue Tasks</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task Name</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingTasks.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground">No pending tasks!</TableCell></TableRow>
                    ) : (
                      pendingTasks.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell className="font-medium">{t.title}</TableCell>
                          <TableCell className="text-red-500 font-semibold">{format(new Date(t.due_date), "MMM dd, yyyy")}</TableCell>
                          <TableCell><Badge variant="destructive">Overdue</Badge></TableCell>
                          <TableCell><Button size="sm" onClick={() => navigate('/student/dashboard')}>Go to Dashboard to Submit</Button></TableCell>
                        </TableRow>
                      )))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* UPCOMING VIEW */}
          {(currentTab === "all" || currentTab === "upcoming") && (
            <Card className="border-blue-100">
              <CardHeader className="bg-blue-50/50">
                <CardTitle className="flex items-center gap-2"><CalendarIcon className="h-5 w-5 text-blue-500" /> Upcoming Deadlines</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task Name</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Time Left</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcomingTasks.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground">No upcoming tasks.</TableCell></TableRow>
                    ) : (
                      upcomingTasks.map((t) => {
                        const daysLeft = Math.ceil((new Date(t.due_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                        return (
                          <TableRow key={t.id}>
                            <TableCell className="font-medium">{t.title}</TableCell>
                            <TableCell>{format(new Date(t.due_date), "MMM dd, yyyy")}</TableCell>
                            <TableCell><Badge variant="outline" className="text-blue-600 bg-blue-50">{daysLeft} days left</Badge></TableCell>
                            <TableCell><Button size="sm" variant="outline" onClick={() => navigate('/student/dashboard')}>View Details</Button></TableCell>
                          </TableRow>
                        )
                      }))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}