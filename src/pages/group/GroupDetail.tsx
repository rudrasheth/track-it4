import { useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { KanbanBoard } from "@/components/KanbanBoard";
import { mockGroups, mockTasks, mockNotices, mockUsers } from "@/lib/mockData";
import { Users, TrendingUp } from "lucide-react";

export default function GroupDetail() {
  const { id } = useParams();
  const group = mockGroups.find((g) => g.id === id);

  if (!group) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-foreground">Group not found</h1>
        </div>
      </DashboardLayout>
    );
  }

  const students = mockUsers.filter((u) => group.students.includes(u.id));
  const mentors = mockUsers.filter((u) => group.mentors.includes(u.id));
  const groupTasks = mockTasks.filter((t) => t.groupId === group.id);
  const groupNotices = mockNotices.filter((n) => n.groupId === group.id || !n.groupId);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-foreground">{group.name}</h1>
            <Badge>Semester {group.semester}</Badge>
            {group.isOverdue && (
              <Badge className="bg-destructive text-destructive-foreground">Behind Schedule</Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            Group project tracking and collaboration
          </p>
        </div>

        {/* Team Members */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="mb-2 text-sm font-semibold text-muted-foreground">Students</p>
                  <div className="flex flex-wrap gap-2">
                    {students.map((student) => (
                      <div
                        key={student.id}
                        className="flex items-center gap-2 rounded-lg border border-border bg-card p-2"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">{student.avatar}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium text-foreground">{student.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-sm font-semibold text-muted-foreground">Mentors</p>
                  <div className="flex flex-wrap gap-2">
                    {mentors.map((mentor) => (
                      <div
                        key={mentor.id}
                        className="flex items-center gap-2 rounded-lg border border-primary bg-primary/10 p-2"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">{mentor.avatar}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium text-foreground">{mentor.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Progress Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Overall Progress</span>
                  <span className="text-2xl font-bold text-foreground">{group.progress}%</span>
                </div>
                <Progress value={group.progress} className="h-3" />
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">
                    {groupTasks.filter((t) => t.status === "done").length}
                  </p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-warning">
                    {groupTasks.filter((t) => t.status === "in-progress").length}
                  </p>
                  <p className="text-xs text-muted-foreground">In Progress</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-muted-foreground">
                    {groupTasks.filter((t) => t.status === "todo").length}
                  </p>
                  <p className="text-xs text-muted-foreground">To Do</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="kanban" className="space-y-4">
          <TabsList>
            <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
            <TabsTrigger value="notices">Notices</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          <TabsContent value="kanban">
            <KanbanBoard groupId={group.id} />
          </TabsContent>

          <TabsContent value="notices">
            <Card>
              <CardHeader>
                <CardTitle>Group Notices</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {groupNotices.map((notice) => (
                  <div
                    key={notice.id}
                    className="rounded-lg border border-border bg-card p-4"
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <h3 className="font-semibold text-foreground">{notice.title}</h3>
                      {notice.isPinned && (
                        <Badge variant="default">Pinned</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{notice.content}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline">
            <Card>
              <CardHeader>
                <CardTitle>Project Timeline (Gantt-style)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[3, 4, 5, 6].map((sem) => {
                    const semTasks = groupTasks.filter((t) => t.semester === sem);
                    const completedTasks = semTasks.filter((t) => t.status === "done").length;
                    const progress = semTasks.length > 0 ? (completedTasks / semTasks.length) * 100 : 0;

                    return (
                      <div key={sem} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-foreground">Semester {sem}</span>
                          <span className="text-sm text-muted-foreground">
                            {completedTasks}/{semTasks.length} tasks
                          </span>
                        </div>
                        <Progress value={progress} />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
