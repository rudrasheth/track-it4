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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface CreateGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

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
      toast.error("Please fill in the group name and select a semester");
      return;
    }
    setCreating(true);

    try {
      // --- 1. CLEAN INPUT ---
      const emails = studentEmails
        .split(',')
        .map(e => e.trim().toLowerCase()) // Force lowercase for consistency
        .filter(e => e.length > 0);

      // Only perform checks if user actually entered emails
      if (emails.length > 0) {
        
        // --- 2. CHECK REGISTRATION (Must exist in Profiles) ---
        const { data: existingUsers, error: checkError } = await supabase
          .from('profiles')
          .select('email')
          .in('email', emails);

        if (checkError) throw checkError;

        const foundEmails = existingUsers?.map(u => u.email) || [];
        const missingEmails = emails.filter(e => !foundEmails.includes(e));

        if (missingEmails.length > 0) {
          toast.error(`Not registered users: ${missingEmails.join(', ')}`);
          setCreating(false);
          return; // <--- STOP. Do not create group.
        }

        // --- 3. CHECK IF BUSY (Must NOT be in Group Members) ---
        const { data: busyStudents, error: busyError } = await supabase
          .from('group_members')
          .select('student_email')
          .in('student_email', emails);

        if (busyError) throw busyError;

        if (busyStudents && busyStudents.length > 0) {
          const busyList = busyStudents.map(s => s.student_email);
          toast.error(`Students already in a group: ${busyList.join(', ')}`);
          setCreating(false);
          return; // <--- STOP. Do not create group.
        }
      }

      // --- 4. CREATE GROUP (Only if checks passed) ---
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

      // --- 5. ADD MEMBERS ---
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
            Enter student emails. <b>Only registered students can be added.</b>
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
            <Select value={semester} onValueChange={setSemester}>
              <SelectTrigger><SelectValue placeholder="Select Semester" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Sem 3">Semester 3</SelectItem>
                <SelectItem value="Sem 4">Semester 4</SelectItem>
                <SelectItem value="Sem 5">Semester 5</SelectItem>
                <SelectItem value="Sem 6">Semester 6</SelectItem>
              </SelectContent>
            </Select>
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
            {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create Group"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}