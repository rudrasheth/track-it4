import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function Analytics() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // Chart Data State
  const [statusData, setStatusData] = useState<any>(null);
  const [performanceData, setPerformanceData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        // 1. Fetch Tasks created by this mentor
        const { data: tasks } = await supabase
          .from('tasks')
          .select('id, title, due_date')
          .eq('created_by', user.id);

        if (!tasks || tasks.length === 0) {
            setLoading(false);
            return;
        }

        const taskIds = tasks.map(t => t.id);

        // 2. Fetch Submissions for those tasks
        const { data: submissions } = await supabase
          .from('submissions')
          .select('id, task_id, submitted_at, grade')
          .in('task_id', taskIds);

        // --- CALCULATE METRICS ---
        
        // A. Pending vs Completed
        const totalTasks = tasks.length;
        const totalSubmissions = submissions?.length || 0;
        const pending = totalTasks - totalSubmissions; // Simplified logic (assuming 1 sub per task per student is goal)

        // B. Late Submissions
        let lateCount = 0;
        let onTimeCount = 0;

        submissions?.forEach(sub => {
            const task = tasks.find(t => t.id === sub.task_id);
            if (task) {
                const isLate = new Date(sub.submitted_at) > new Date(task.due_date);
                if (isLate) lateCount++;
                else onTimeCount++;
            }
        });

        // --- PREPARE CHART DATA ---
        
        setStatusData({
          labels: ['Completed', 'Pending'],
          datasets: [{
            data: [totalSubmissions, pending < 0 ? 0 : pending],
            backgroundColor: ['#10b981', '#f59e0b'],
            borderWidth: 0,
          }],
        });

        setPerformanceData({
          labels: ['On Time', 'Late Submission'],
          datasets: [{
            label: 'Submissions',
            data: [onTimeCount, lateCount],
            backgroundColor: ['#3b82f6', '#ef4444'],
          }],
        });

      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">Real-time performance metrics based on your assigned tasks.</p>
        </div>

        {!statusData ? (
            <div className="p-10 text-center border rounded text-muted-foreground">Not enough data to generate analytics yet.</div>
        ) : (
            <div className="grid gap-6 md:grid-cols-2">
            {/* Pending vs Completed */}
            <Card>
                <CardHeader><CardTitle>Submission Status</CardTitle></CardHeader>
                <CardContent className="h-[300px] flex justify-center">
                    <Doughnut data={statusData} options={{ maintainAspectRatio: false }} />
                </CardContent>
            </Card>

            {/* Late vs On Time */}
            <Card>
                <CardHeader><CardTitle>Punctuality</CardTitle></CardHeader>
                <CardContent className="h-[300px] flex justify-center">
                    <Bar 
                        data={performanceData} 
                        options={{ 
                            maintainAspectRatio: false,
                            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
                        }} 
                    />
                </CardContent>
            </Card>
            </div>
        )}
      </div>
    </DashboardLayout>
  );
}