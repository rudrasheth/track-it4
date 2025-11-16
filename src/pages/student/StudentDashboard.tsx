import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { NoticeCarousel } from "@/components/NoticeCarousel";
import { KanbanBoard } from "@/components/KanbanBoard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockTasks, mockSubmissions, mockMessages, mockUsers } from "@/lib/mockData";
import { Calendar, Clock, FileText, MessageSquare, Send } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function StudentDashboard() {
  const [message, setMessage] = useState("");
  const upcomingTasks = mockTasks
    .filter((t) => t.status !== "done" && new Date(t.dueDate) > new Date())
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 3);

  const pendingTasksCount = mockTasks.filter((t) => t.status === "todo").length;

  const studentSubmissions = mockSubmissions.filter((s) => s.studentId === "s1");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Track your projects and deadlines</p>
        </div>

        {/* Quick View Grid */}
        <div className="grid gap-4 md:grid-cols-3">
          <NoticeCarousel />

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4 text-primary" />
                Upcoming Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingTasks.map((task) => (
                <div key={task.id} className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(task.dueDate), "MMM dd")}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {Math.ceil((new Date(task.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}d
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4 text-warning" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-2xl font-bold text-foreground">{pendingTasksCount}</p>
                <p className="text-xs text-muted-foreground">Pending Tasks</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{studentSubmissions.length}</p>
                <p className="text-xs text-muted-foreground">Total Submissions</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Section */}
        <Tabs defaultValue="kanban" className="space-y-4">
          <TabsList>
            <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
            <TabsTrigger value="submissions">My Submissions</TabsTrigger>
            <TabsTrigger value="chat">Group Chat</TabsTrigger>
          </TabsList>

          <TabsContent value="kanban">
            <KanbanBoard groupId="g1" />
          </TabsContent>

          <TabsContent value="submissions">
            <Card>
              <CardHeader>
                <CardTitle>Submission History</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task</TableHead>
                      <TableHead>File</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentSubmissions.map((sub) => {
                      const task = mockTasks.find((t) => t.id === sub.taskId);
                      return (
                        <TableRow key={sub.id}>
                          <TableCell className="font-medium">{task?.title}</TableCell>
                          <TableCell className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            {sub.fileUrl}
                          </TableCell>
                          <TableCell>{format(new Date(sub.submittedAt), "MMM dd, yyyy")}</TableCell>
                          <TableCell>
                            {sub.grade ? (
                              <Badge variant={sub.grade >= 80 ? "default" : "secondary"}>
                                {sub.grade}/100
                              </Badge>
                            ) : (
                              <Badge variant="outline">Pending</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {sub.grade ? (
                              <Badge className="bg-success text-success-foreground">Graded</Badge>
                            ) : (
                              <Badge className="bg-warning text-warning-foreground">Under Review</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chat">
            <Card className="h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle>AI Research Project - Group Chat</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="flex-1 space-y-4 overflow-y-auto mb-4">
                  {mockMessages.map((msg) => {
                    const sender = mockUsers.find((u) => u.id === msg.senderId);
                    return (
                      <div key={msg.id} className="flex items-start gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">{sender?.avatar}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">
                              {sender?.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(msg.timestamp), "HH:mm")}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{msg.content}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message... (@mention teammates)"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        setMessage("");
                      }
                    }}
                  />
                  <Button size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
