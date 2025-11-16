import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CreateGroupModal } from "@/components/CreateGroupModal";
import { mockGroups } from "@/lib/mockData";
import { Plus, Copy, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const mockGroupCodes = ["P8K2M9", "L4N7Q3", "R9T5W1"];

export default function MyGroups() {
  const [modalOpen, setModalOpen] = useState(false);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Join code copied!");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Groups</h1>
            <p className="text-muted-foreground">Manage your project groups</p>
          </div>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Group
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {mockGroups.map((group, idx) => (
            <Card key={group.id} className={group.isOverdue ? "border-destructive" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{group.name}</CardTitle>
                    <Badge variant="secondary">Semester {group.semester}</Badge>
                  </div>
                  {group.isOverdue && <Badge variant="destructive">Late</Badge>}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    {group.students.length}/5 Members
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyCode(mockGroupCodes[idx])}
                    className="h-8 gap-2"
                  >
                    <span className="font-mono text-xs">{mockGroupCodes[idx]}</span>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-semibold">{group.progress}%</span>
                  </div>
                  <Progress value={group.progress} />
                </div>

                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link to={`/group/${group.id}`}>View Details</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <CreateGroupModal open={modalOpen} onOpenChange={setModalOpen} />
      </div>
    </DashboardLayout>
  );
}
