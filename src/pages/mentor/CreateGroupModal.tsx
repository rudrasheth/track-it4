import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// --- THIS INTERFACE UPDATE FIXES YOUR ERROR ---
interface CreateGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void; // <--- This line enables the prop in MyGroups.tsx
}
// ----------------------------------------------

export function CreateGroupModal({ open, onOpenChange, onSuccess }: CreateGroupModalProps) {
  const { user } = useAuth();
  const [creating, setCreating] = useState(false);
  
  // Form State
  const [groupName, setGroupName] = useState("");
  const [semester, setSemester] = useState("");
  const [description, setDescription] = useState("");
  const [studentEmails, setStudentEmails] = useState("");

  const handleCreateGroup = async () => {
    if (!groupName || !semester) {
      toast.error("Please fill in the group name and semester");
      return;
    }
    setCreating(true);

    try {
      // 1. Create Group
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .insert({
          name: groupName,
          semester: semester,
          description: description,
          created_by: user?.id
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // 2. Add Students by Email
      const emails = studentEmails
        .split(',')
        .map(e => e.trim())
        .filter(e => e.length > 0);

      if (emails.length > 0) {
        const membersData = emails.map(email => ({
          group_id: groupData.id,
          student_email: email
        }));

        const { error: memberError } = await supabase
          .from('group_members')
          .insert(membersData);

        if (memberError) throw memberError;
      }

      toast.success("Group created successfully!");
      
      // Reset Form
      setGroupName("");
      setSemester("");
      setDescription("");
      setStudentEmails("");
      
      // Close and Notify Parent to refresh list
      onOpenChange(false);
      if (onSuccess) onSuccess();

    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to create group");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Group</DialogTitle>
          <DialogDescription>
            Create a group and add students by email.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Group Name</Label>
            <Input 
              id="name" 
              placeholder="e.g. AI Team A" 
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="semester">Semester</Label>
            <Input 
              id="semester" 
              placeholder="e.g. Sem 5" 
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="emails">Student Emails (Comma separated)</Label>
            <Textarea 
              id="emails" 
              placeholder="student1@mail.com, student2@mail.com" 
              value={studentEmails}
              onChange={(e) => setStudentEmails(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="desc">Description (Optional)</Label>
            <Input 
              id="desc" 
              placeholder="Optional" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleCreateGroup} disabled={creating}>
            {creating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
              </>
            ) : (
              "Create Group"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}