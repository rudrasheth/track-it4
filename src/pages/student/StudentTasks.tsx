import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle, Clock, AlertCircle, ArrowRight } from "lucide-react";
import { format, isPast } from "date-fns";
import { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function StudentTasks() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !user.email) return;
      try {
        // 1. Find My Group
        const { data: memberData } = await supabase
            .from('group_members')
            .select('group_id')
            .eq('student_email', user.email)
            .maybeSingle();
        
        const myGroupId = memberData?.group_id;

        if (!myGroupId) {
            setTasks([]);
            setLoading(false);
            return;
        }

        // 2. Get tasks for MY GROUP only
        const { data: tasksData } = await supabase
          .from('tasks')
          .select('*')
          .eq('group_id', myGroupId) // <--- Filtering is key
          .order('due_date', { ascending: true });

        // 3. Get my submissions
        const { data: mySubs } = await supabase
          .from('submissions')
          .select('task_id')
          .eq('student_id', user.id);

        const submittedTaskIds = new Set(mySubs?.map(s => s.task_id));

        // 4. Merge
        const processedTasks = (tasksData || []).map(task => ({
            ...task,
            isSubmitted: submittedTaskIds.has(task.id),
            isOverdue: isPast(new Date(task.due_date)) && !submittedTaskIds.has(task.id)
        }));

        setTasks(processedTasks);
      } catch (error) {
        console.error("Error loading tasks:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) return <div className="p-10 text-center">Loading tasks...</div>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Assigned Tasks</h1>
          <p className="text-muted-foreground">View all your assignments and due dates</p>
        </div>

        {tasks.length === 0 ? (
            <div className="text-center p-10 border rounded-lg bg-muted/10">
                <p className="text-lg font-medium">No tasks assigned.</p>
                <p className="text-muted-foreground">You might not be in a group yet, or your mentor hasn't assigned anything.</p>
            </div>
        ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tasks.map((task) => (
                <Card key={task.id} className={`flex flex-col ${task.isSubmitted ? "border-green-200 bg-green-50/30" : ""}`}>
                <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                    <CardTitle className="text-base line-clamp-1" title={task.title}>
                        {task.title}
                    </CardTitle>
                    {task.isSubmitted ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : task.isOverdue ? (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                    ) : (
                        <Clock className="h-5 w-5 text-muted-foreground" />
                    )}
                    </div>
                </CardHeader>
                <CardContent className="flex-1">
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {task.description || "No description provided."}
                    </p>
                    <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className={task.isOverdue ? "text-red-500 font-medium" : "text-muted-foreground"}>
                            Due: {format(new Date(task.due_date), "MMM dd, yyyy")}
                        </span>
                    </div>
                </CardContent>
                <CardFooter>
                    {task.isSubmitted ? (
                        <Button variant="outline" className="w-full border-green-200 text-green-700 hover:text-green-800 hover:bg-green-50" disabled>
                            Completed
                        </Button>
                    ) : (
                        <Button className="w-full" onClick={() => navigate('/student/dashboard')}>
                            Go to Upload <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    )}
                </CardFooter>
                </Card>
            ))}
            </div>
        )}
      </div>
    </DashboardLayout>
  );
}