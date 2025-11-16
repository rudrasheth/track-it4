import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Bar, Line, Radar, Doughnut } from "react-chartjs-2";
import { mockGroups, mockTasks } from "@/lib/mockData";
import { Download } from "lucide-react";
import { toast } from "sonner";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function Analytics() {
  const pendingVsCompletedData = {
    labels: mockGroups.map((g) => g.name),
    datasets: [
      {
        label: "Pending",
        data: [6, 10, 3],
        backgroundColor: "hsl(var(--destructive))",
      },
      {
        label: "Completed",
        data: [24, 18, 30],
        backgroundColor: "hsl(var(--success))",
      },
    ],
  };

  const lateSubmissionsData = {
    labels: mockGroups.map((g) => g.name),
    datasets: [
      {
        label: "Late Submissions",
        data: [2, 5, 1],
        backgroundColor: "hsl(var(--warning))",
      },
    ],
  };

  const submissionTrendData = {
    labels: Array.from({ length: 30 }, (_, i) => `Day ${i + 1}`),
    datasets: [
      {
        label: "Submissions",
        data: Array.from({ length: 30 }, () => Math.floor(Math.random() * 10)),
        borderColor: "hsl(var(--primary))",
        backgroundColor: "hsl(var(--primary) / 0.1)",
        fill: true,
      },
    ],
  };

  const progressBySemesterData = {
    labels: ["Semester 3", "Semester 4", "Semester 5", "Semester 6"],
    datasets: [
      {
        label: "Completion Rate",
        data: [85, 72, 90, 68],
        backgroundColor: "hsl(var(--primary) / 0.2)",
        borderColor: "hsl(var(--primary))",
        borderWidth: 2,
      },
    ],
  };

  const taskStatusData = {
    labels: ["To Do", "In Progress", "Review", "Done"],
    datasets: [
      {
        data: [
          mockTasks.filter((t) => t.status === "todo").length,
          mockTasks.filter((t) => t.status === "in-progress").length,
          mockTasks.filter((t) => t.status === "review").length,
          mockTasks.filter((t) => t.status === "done").length,
        ],
        backgroundColor: [
          "hsl(var(--muted))",
          "hsl(var(--warning))",
          "hsl(var(--primary))",
          "hsl(var(--success))",
        ],
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: "hsl(var(--foreground))",
        },
      },
    },
    scales: {
      x: {
        ticks: { color: "hsl(var(--muted-foreground))" },
        grid: { color: "hsl(var(--border))" },
      },
      y: {
        ticks: { color: "hsl(var(--muted-foreground))" },
        grid: { color: "hsl(var(--border))" },
      },
    },
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: "hsl(var(--foreground))",
        },
      },
    },
    scales: {
      r: {
        ticks: { color: "hsl(var(--muted-foreground))" },
        grid: { color: "hsl(var(--border))" },
      },
    },
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">Comprehensive group performance metrics</p>
          </div>
          <Button
            variant="outline"
            onClick={() => toast.success("PDF downloaded!")}
          >
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>

        <Tabs defaultValue="charts">
          <TabsList>
            <TabsTrigger value="charts">Comparison</TabsTrigger>
            <TabsTrigger value="table">Table View</TabsTrigger>
          </TabsList>

          <TabsContent value="charts" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Pending vs Completed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <Bar data={pendingVsCompletedData} options={chartOptions} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Late Submissions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <Bar data={lateSubmissionsData} options={chartOptions} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Submission Trend (Last 30 Days)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <Line data={submissionTrendData} options={chartOptions} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Progress by Semester</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <Radar data={progressBySemesterData} options={radarOptions} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Task Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <Doughnut
                      data={taskStatusData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            labels: {
                              color: "hsl(var(--foreground))",
                            },
                          },
                        },
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="table">
            <Card>
              <CardHeader>
                <CardTitle>Group Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Group</TableHead>
                      <TableHead>Total Tasks</TableHead>
                      <TableHead>Done</TableHead>
                      <TableHead>Pending</TableHead>
                      <TableHead>On-Time %</TableHead>
                      <TableHead>Last Active</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockGroups.map((group) => {
                      const groupTasks = mockTasks.filter((t) => t.groupId === group.id);
                      const done = groupTasks.filter((t) => t.status === "done").length;
                      const pending = groupTasks.length - done;
                      const onTimePercent = Math.round((done / groupTasks.length) * 100) || 0;

                      return (
                        <TableRow key={group.id}>
                          <TableCell className="font-medium">{group.name}</TableCell>
                          <TableCell>{groupTasks.length}</TableCell>
                          <TableCell className="text-success">{done}</TableCell>
                          <TableCell className="text-warning">{pending}</TableCell>
                          <TableCell>{onTimePercent}%</TableCell>
                          <TableCell className="text-muted-foreground">2 hours ago</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
