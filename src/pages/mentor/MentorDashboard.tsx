import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, CheckCircle, Loader2, Pencil, MessageSquare, Save } from "lucide-react";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function MentorDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [stats, setStats] = useState({ totalTasks: 0, totalSubmissions: 0, activeStudents: 0 });
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);
  const [mentorName, setMentorName] = useState("");

  // Grading Modal State
  const [isGradeOpen, setIsGradeOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState<any>(null);
  const [gradeInput, setGradeInput] = useState("");
  const [feedbackInput, setFeedbackInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      
      // 1. Profile
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
      if (profile) setMentorName(profile.full_name);

      // 2. Tasks
      const { data: myTasks } = await supabase.from('tasks').select('id').eq('created_by', user.id);
      const myTaskIds = myTasks?.map(t => t.id) || [];

      // 3. Submissions
      if (myTaskIds.length > 0) {
        const { data: submissions } = await supabase
          .from('submissions')
          .select(`*, tasks ( title )`)
          .in('task_id', myTaskIds)
          .order('submitted_at', { ascending: false });

        // Fetch student profiles manually
        const studentIds = Array.from(new Set(submissions?.map(s => s.student_id)));
        const { data: profiles } = await supabase.from('profiles').select('id, full_name, avatar_url').in('id', studentIds);

        const enrichedSubs = submissions?.map(sub => {
          const student = profiles?.find(p => p.id === sub.student_id);
          return {
            ...sub,
            student_name: student?.full_name || "Unknown",
            avatar_url: student?.avatar_url,
            task_title: sub.tasks?.title
          };
        });

        setRecentSubmissions(enrichedSubs || []);
        setStats({
          totalTasks: myTaskIds.length,
          totalSubmissions: submissions?.length || 0,
          activeStudents: studentIds.length
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openGradeModal = (submission: any) => {
    setSelectedSub(submission);
    setGradeInput(submission.grade || "");
    setFeedbackInput(submission.feedback || "");
    setIsGradeOpen(true);
  };

  const handleSaveGrade = async () => {
    if (!selectedSub) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('submissions')
        .update({ 
          grade: gradeInput ? parseInt(gradeInput) : null,
          feedback: feedbackInput 
        })
        .eq('id', selectedSub.id);

      if (error) throw error;

      toast.success("Grade and feedback saved!");
      setIsGradeOpen(false);
      fetchData(); // Refresh list
    } catch (error) {
      toast.error("Failed to save grade");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Welcome back, {mentorName || "Mentor"}!</h1>
          <p className="text-muted-foreground">Here is the real-time activity from your students.</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card><CardHeader><CardTitle><span className="text-sm text-muted-foreground">Assigned Tasks</span></CardTitle></CardHeader>
            <CardContent><div className="flex items-center gap-2"><div className="text-blue-500"><FileText size={20} /></div><div className="text-2xl font-bold">{stats.totalTasks}</div></div></CardContent></Card>
          <Card><CardHeader><CardTitle><span className="text-sm text-muted-foreground">Submissions Received</span></CardTitle></CardHeader>
            <CardContent><div className="flex items-center gap-2"><div className="text-green-500"><CheckCircle size={20} /></div><div className="text-2xl font-bold">{stats.totalSubmissions}</div></div></CardContent></Card>
          <Card><CardHeader><CardTitle><span className="text-sm text-muted-foreground">Students Engaged</span></CardTitle></CardHeader>
            <CardContent><div className="flex items-center gap-2"><div className="text-purple-500"><Users size={20} /></div><div className="text-2xl font-bold">{stats.activeStudents}</div></div></CardContent></Card>
        </div>

        {/* Submissions Table */}
        <Card>
          <CardHeader><CardTitle>Recent Submissions</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Task Name</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Submitted At</TableHead>
                  <TableHead>Grading</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentSubmissions.length === 0 ? (
                   <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No submissions yet.</TableCell></TableRow>
                ) : (
                  recentSubmissions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <div className="flex items-center gap-2 font-medium">
                            <Avatar className="h-6 w-6"><AvatarFallback>{sub.student_name[0]}</AvatarFallback></Avatar>
                            {sub.student_name}
                        </div>
                      </TableCell>
                      <TableCell>{sub.task_title}</TableCell>
                      <TableCell>
                        <a href={sub.file_url} target="_blank" className="text-blue-600 hover:underline text-sm font-medium">View File</a>
                      </TableCell>
                      <TableCell>{format(new Date(sub.submitted_at), "MMM dd, HH:mm")}</TableCell>
                      <TableCell>
                        {sub.grade ? (
                            <div className="flex items-center gap-2 cursor-pointer hover:opacity-80" onClick={() => openGradeModal(sub)}>
                                <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
                                  {sub.grade}/25
                                </Badge>
                                {sub.feedback && <MessageSquare className="h-4 w-4 text-muted-foreground" />}
                            </div>
                        ) : (
                            <Button size="sm" variant="outline" onClick={() => openGradeModal(sub)}>
                                <Pencil className="h-3 w-3 mr-2" /> Grade
                            </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Grading Modal */}
        <Dialog open={isGradeOpen} onOpenChange={setIsGradeOpen}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Grade Submission</DialogTitle>
                    <DialogDescription>
                        Enter a grade and feedback for <b>{selectedSub?.student_name}</b>'s submission.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="grade" className="text-right">Grade (0-25)</Label>
                        <Input id="grade" type="number" max={25} value={gradeInput} onChange={(e) => setGradeInput(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="feedback" className="text-right">Feedback</Label>
                        <Textarea id="feedback" placeholder="Great work, but consider..." value={feedbackInput} onChange={(e) => setFeedbackInput(e.target.value)} className="col-span-3" />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSaveGrade} disabled={saving}>
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Grade
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

      </div>
    </DashboardLayout>
  );
}