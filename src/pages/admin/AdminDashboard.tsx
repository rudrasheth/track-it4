import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockGroups, mockTasks, mockUsers } from "@/lib/mockData";
import { Users, FolderKanban, Activity, Download, Upload } from "lucide-react";
import { toast } from "sonner";

export default function AdminDashboard() {
  const totalUsers = mockUsers.length;
  const totalGroups = mockGroups.length;
  const completionRate = Math.round(
    (mockTasks.filter((t) => t.status === "done").length / mockTasks.length) * 100
  );

  const handleExportPDF = () => {
    toast.success("Exporting dashboard as PDF...");
  };

  const handleExportCSV = () => {
    toast.success("Exporting data as CSV...");
  };

  const handleBulkUpload = () => {
    toast.info("Bulk user upload feature - coming soon!");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground">System overview and management</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportPDF}>
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button onClick={handleBulkUpload}>
              <Upload className="mr-2 h-4 w-4" />
              Bulk Upload
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                {mockUsers.filter((u) => u.role === "student").length} Students, {mockUsers.filter((u) => u.role === "mentor").length} Mentors
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Groups</CardTitle>
              <FolderKanban className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{totalGroups}</div>
              <p className="text-xs text-muted-foreground">
                {mockGroups.filter((g) => !g.isOverdue).length} On Track
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{completionRate}%</div>
              <p className="text-xs text-muted-foreground">Overall completion rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Heatmap */}
        <Card>
          <CardHeader>
            <CardTitle>Groups Heatmap</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {mockGroups.map((group) => (
                <div
                  key={group.id}
                  className={`rounded-lg border p-4 transition-colors ${
                    group.progress >= 75
                      ? "border-success bg-success/10"
                      : group.progress >= 50
                      ? "border-warning bg-warning/10"
                      : "border-destructive bg-destructive/10"
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">{group.name}</h3>
                    <Badge
                      className={
                        group.progress >= 75
                          ? "bg-success text-success-foreground"
                          : group.progress >= 50
                          ? "bg-warning text-warning-foreground"
                          : "bg-destructive text-destructive-foreground"
                      }
                    >
                      {group.progress}%
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>Semester {group.semester}</p>
                    <p>{group.students.length} Students</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Settings Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>System Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <p className="font-medium text-foreground">SMTP Configuration</p>
                <p className="text-sm text-muted-foreground">Configure email server settings</p>
              </div>
              <Button variant="outline">Configure</Button>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <p className="font-medium text-foreground">Semester Settings</p>
                <p className="text-sm text-muted-foreground">Manage academic calendar and semesters</p>
              </div>
              <Button variant="outline">Manage</Button>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <p className="font-medium text-foreground">User Permissions</p>
                <p className="text-sm text-muted-foreground">Control role-based access</p>
              </div>
              <Button variant="outline">Edit</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
