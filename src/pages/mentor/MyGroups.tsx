import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Users, Trash2, UserPlus, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { supabase } from "@/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { CreateGroupModal } from "@/components/CreateGroupModal"; // <--- IMPORT THE NEW COMPONENT

interface Group {
  id: string;
  name: string;
  semester: string;
  description: string;
  members_count?: number;
}

export default function MyGroups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  
  // This one state controls the shared modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // State for Add Member Dialog (Still local for now)
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [newMemberEmails, setNewMemberEmails] = useState("");
  const [addingMember, setAddingMember] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, [user]);

  const fetchGroups = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('groups')
        .select(`*, group_members (count)`)
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedGroups = data.map((g: any) => ({
        ...g,
        members_count: g.group_members?.[0]?.count || 0
      }));

      setGroups(formattedGroups);
    } catch (error) {
      console.error("Error fetching groups:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!selectedGroupId || !newMemberEmails) return;
    setAddingMember(true);
    try {
      const emails = newMemberEmails.split(',').map(e => e.trim()).filter(e => e.length > 0);
      if (emails.length === 0) return;

      const membersData = emails.map(email => ({
        group_id: selectedGroupId,
        student_email: email
      }));

      const { error } = await supabase.from('group_members').insert(membersData);
      if (error) throw error;

      toast.success("Students added successfully!");
      setIsAddMemberOpen(false);
      setNewMemberEmails("");
      fetchGroups();
    } catch (error) {
      toast.error("Failed to add students");
    } finally {
      setAddingMember(false);
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (!confirm("Delete this group?")) return;
    await supabase.from('groups').delete().eq('id', id);
    fetchGroups();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">My Groups</h1>
            <p className="text-muted-foreground">Manage your student project groups</p>
          </div>
          
          {/* BUTTON OPENS THE SHARED COMPONENT */}
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Create Group
          </Button>
        </div>

        {/* SHARED CREATE GROUP MODAL */}
        <CreateGroupModal 
          open={isCreateOpen} 
          onOpenChange={setIsCreateOpen} 
          // @ts-ignore
          onSuccess={fetchGroups} // Refresh list when done
        />

        {/* GROUP LIST */}
        {loading ? (
          <div className="text-center p-10">Loading groups...</div>
        ) : groups.length === 0 ? (
          <div className="text-center p-10 border rounded-lg bg-muted/20">
            <Users className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="text-lg font-medium">No groups created yet</h3>
            <p className="text-muted-foreground">Click the button above to start your first group.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <Card key={group.id} className="relative group hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle>{group.name}</CardTitle>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDeleteGroup(group.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Badge variant="secondary" className="w-fit">{group.semester}</Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 min-h-[40px]">{group.description || "No description."}</p>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" /> <span>{group.members_count} Students</span>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => { setSelectedGroupId(group.id); setIsAddMemberOpen(true); }}>
                        <UserPlus className="h-4 w-4 mr-2" /> Add Member
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* ADD MEMBER DIALOG (Kept local as it depends on selected ID) */}
        <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
            <DialogContent>
                <DialogHeader><DialogTitle>Add Students</DialogTitle><DialogDescription>Enter email addresses to add to this group.</DialogDescription></DialogHeader>
                <div className="py-4">
                    <Label>Student Emails (Comma separated)</Label>
                    <Textarea placeholder="newstudent@mail.com" value={newMemberEmails} onChange={(e) => setNewMemberEmails(e.target.value)} />
                </div>
                <DialogFooter>
                    <Button onClick={handleAddMember} disabled={addingMember}>{addingMember ? <Loader2 className="animate-spin" /> : "Add Students"}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}