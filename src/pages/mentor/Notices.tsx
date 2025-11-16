import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { mockNotices, mockGroups } from "@/lib/mockData";
import { Pin, FileText, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function Notices() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [scope, setScope] = useState("all");
  const [isPinned, setIsPinned] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const groupCount = scope === "all" ? mockGroups.length : 1;
    toast.success(`Notice sent to ${groupCount} group${groupCount > 1 ? "s" : ""}!`);
    setTitle("");
    setContent("");
    setScope("all");
    setIsPinned(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Broadcast Notices</h1>
          <p className="text-muted-foreground">Send announcements to your groups</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create Notice</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Notice title"
                  required
                />
              </div>

              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your announcement..."
                  rows={4}
                  required
                />
              </div>

              <div>
                <Label htmlFor="scope">Scope</Label>
                <Select value={scope} onValueChange={setScope}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Groups</SelectItem>
                    {mockGroups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="pin">Pin Notice</Label>
                  <p className="text-sm text-muted-foreground">
                    Pinned notices appear at the top
                  </p>
                </div>
                <Switch
                  id="pin"
                  checked={isPinned}
                  onCheckedChange={setIsPinned}
                />
              </div>

              <Button type="submit" className="w-full">
                Send Notice
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Notices</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {mockNotices.map((notice) => (
                <AccordionItem key={notice.id} value={notice.id}>
                  <AccordionTrigger>
                    <div className="flex items-center gap-3">
                      {notice.isPinned && (
                        <Pin className="h-4 w-4 text-primary" />
                      )}
                      <span className="font-medium">{notice.title}</span>
                      <Badge variant="outline" className="ml-2">
                        {notice.groupId ? "Group" : "All"}
                      </Badge>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {new Date(notice.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-2">
                      <p className="text-sm">{notice.content}</p>
                      {notice.fileUrl && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <FileText className="h-4 w-4" />
                          {notice.fileUrl}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="mr-2 h-3 w-3" />
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="mr-2 h-3 w-3" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
