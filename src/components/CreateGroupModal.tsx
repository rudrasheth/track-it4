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
import { supabase, supabaseUrl, supabaseKey } from "@/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

const generateJoinCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

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
      // --- STEP 1: VERIFY EMAILS EXIST ---
      const emails = studentEmails
        .split(',')
        .map(e => e.trim().toLowerCase())
        .filter(e => e.length > 0);

      if (emails.length > 0) {
        const { data: existingUsers, error: checkError } = await supabase
          .from('profiles')
          .select('email')
          .in('email', emails);

        if (checkError) throw checkError;

        const foundEmails = existingUsers?.map(u => u.email) || [];
        const missingEmails = emails.filter(e => !foundEmails.includes(e));

        if (missingEmails.length > 0) {
          toast.error(`These students are not registered: ${missingEmails.join(', ')}`);
          setCreating(false);
          return; // STOP HERE
        }
      }
      // -----------------------------------

      // 2. Create Group
      const joinCode = generateJoinCode();

      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .insert({
          name: groupName,
          semester: semester,
          description: description,
          created_by: user?.id,
          join_code: joinCode
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // 3. Add Verified Students
      if (emails.length > 0) {
        const membersData = emails.map(email => ({
          group_id: groupData.id,
          student_email: email
        }));

        const { error: memberError } = await supabase
          .from('group_members')
          .insert(membersData);

        if (memberError) throw memberError;

        // Best-effort: email join code to the first email (treated as leader)
        const leaderEmail = emails[0];
        if (leaderEmail) {
          try {
            const functionUrl = `${supabaseUrl}/functions/v1/send-join-code`;
            const response = await fetch(functionUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseKey}`
              },
              body: JSON.stringify({ email: leaderEmail, joinCode, groupName })
            });
            
            if (!response.ok) {
              const errorText = await response.text();
              console.error('Email send error:', errorText);
              toast.error(`Group created but email failed: ${errorText}`);
            } else {
              const result = await response.json();
              if (result?.error) {
                console.error('Email function returned error:', result.error);
                toast.error(`Group created but email failed: ${result.error}`);
              } else {
                console.log('Email sent successfully to:', leaderEmail);
                toast.success(`Join code emailed to ${leaderEmail}`);
              }
            }
          } catch (err: any) {
            console.error('send-join-code exception:', err);
            toast.message(`Group created; join code not emailed: ${err?.message || 'Network error'}`);
          }
        }
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
          
          {/* Group Name Input */}
          <div className="grid gap-2">
            <Label htmlFor="name">Group Name</Label>
            <Input 
              id="name" 
              placeholder="e.g. AI Team A" 
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>

          {/* Semester Dropdown (Updated) */}
          <div className="grid gap-2">
            <Label htmlFor="semester">Semester</Label>
            <Select value={semester} onValueChange={setSemester}>
              <SelectTrigger>
                <SelectValue placeholder="Select Semester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Sem 3">Semester 3</SelectItem>
                <SelectItem value="Sem 4">Semester 4</SelectItem>
                <SelectItem value="Sem 5">Semester 5</SelectItem>
                <SelectItem value="Sem 6">Semester 6</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Emails Input */}
          <div className="grid gap-2">
            <Label htmlFor="emails">Student Emails (Comma separated)</Label>
            <Textarea 
              id="emails" 
              placeholder="student1@mail.com, student2@mail.com" 
              value={studentEmails}
              onChange={(e) => setStudentEmails(e.target.value)}
            />
          </div>

          {/* Description Input */}
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