import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Users, Trash2, UserPlus, Loader2, ArrowUpCircle } from "lucide-react";
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
import { CreateGroupModal } from "@/components/CreateGroupModal";

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
  
  // Shared Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Local State for Add Member
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
        .order('semester', { ascending: true });

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
      const emails = newMemberEmails
        .split(',')
        .map(e => e.trim().toLowerCase())
        .filter(e => e.length > 0);

      if (emails.length === 0) {
          setAddingMember(false);
          return;
      }

      // Check Registration
      const { data: existingUsers, error: checkError } = await supabase
        .from('profiles')
        .select('email')
        .in('email', emails);

      if (checkError) throw checkError;

      const foundEmails = existingUsers?.map(u => u.email) || [];
      const missingEmails = emails.filter(e => !foundEmails.includes(e));

      if (missingEmails.length > 0) {
        toast.error(`Not registered: ${missingEmails.join(', ')}`);
        setAddingMember(false);
        return;
      }

      // Check if already in a group
      const { data: busyStudents, error: busyError } = await supabase
        .from('group_members')
        .select('student_email')
        .in('student_email', emails);

      if (busyError) throw busyError;

      if (busyStudents && busyStudents.length > 0) {
        const busyEmails = busyStudents.map(s => s.student_email);
        toast.error(`Already in a group: ${busyEmails.join(', ')}`);
        setAddingMember(false);
        return;
      }

      // Add to group
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
    if (!confirm("Are you sure? This will delete the group and ALL its tasks/notices.")) return;
    try {
      const { error } = await supabase.from('groups').delete().eq('id', id);
      if (error) throw error;
      toast.success("Group deleted");
      fetchGroups();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete group");
    }
  };

  const handlePromoteGroup = async (group: Group) => {
    const currentSemNum = parseInt(group.semester.replace(/\D/g, ''));
    
    if (isNaN(currentSemNum)) {
        toast.error("Cannot auto-promote this semester format.");
        return;
    }
    
    // Extra Safety Check
    if (currentSemNum >= 6) {
        toast.error("Maximum semester reached.");
        return;
    }

    const nextSemStr = `Sem ${currentSemNum + 1}`;
    
    if (!confirm(`Promote "${group.name}" from ${group.semester} to ${nextSemStr}?`)) return;

    try {
        const { error } = await supabase
            .from('groups')
            .update({ semester: nextSemStr })
            .eq('id', group.id);

        if (error) throw error;
        
        toast.success(`Group promoted to ${nextSemStr}!`);
        fetchGroups();
    } catch (error) {
        toast.error("Failed to promote group");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">My Groups</h1>
            <p className="text-muted-foreground">Manage your student project groups</p>
          </div>
          
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Create Group
          </Button>
        </div>

        <CreateGroupModal 
          open={isCreateOpen} 
          onOpenChange={setIsCreateOpen} 
          // @ts-ignore
          onSuccess={fetchGroups} 
        />

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
            {groups.map((group) => {
              // Calculate Sem Number for Logic
              const semNum = parseInt(group.semester.replace(/\D/g, '')) || 0;

              return (
                <Card key={group.id} className="relative group hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle>{group.name}</CardTitle>
                      <div className="flex gap-1">
                          {/* PROMOTE BUTTON - ONLY SHOW IF SEM < 6 */}
                          {semNum > 0 && semNum < 6 && (
                             <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-50" 
                                onClick={() => handlePromoteGroup(group)}
                                title="Promote to next semester"
                            >
                              <ArrowUpCircle className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {/* DELETE BUTTON */}
                          <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50" 
                              onClick={() => handleDeleteGroup(group.id)}
                              title="Delete Group"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                      </div>
                    </div>
                    <Badge variant="secondary" className="w-fit">{group.semester}</Badge>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4 min-h-[40px]">
                      {group.description || "No description."}
                    </p>
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
              );
            })}
          </div>
        )}

        <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Students</DialogTitle>
                    <DialogDescription>Enter email addresses. Only registered students not in a group.</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Label>Student Emails (Comma separated)</Label>
                    <Textarea placeholder="student1@mail.com" value={newMemberEmails} onChange={(e) => setNewMemberEmails(e.target.value)} />
                </div>
                <DialogFooter>
                    <Button onClick={handleAddMember} disabled={addingMember}>
                        {addingMember ? <Loader2 className="animate-spin" /> : "Add Students"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}