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
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface JoinGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function JoinGroupModal({ open, onOpenChange, onSuccess }: JoinGroupModalProps) {
  const { user } = useAuth();
  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);

  const handleJoin = async () => {
    if (!code || code.length < 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }
    setJoining(true);

    try {
      if (!user?.email) throw new Error("User email not found");

      // 1. Find group by code
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('id, name')
        .eq('join_code', code)
        .single();

      if (groupError || !group) {
        toast.error("Invalid code. Group not found.");
        setJoining(false);
        return;
      }

      // 2. Check if already a member
      const { data: existing } = await supabase
        .from('group_members')
        .select('id')
        .eq('student_email', user.email)
        .eq('group_id', group.id)
        .single();

      if (existing) {
        toast.error(`You are already in ${group.name}`);
        setJoining(false);
        return;
      }

      // 3. Join Group
      const { error: joinError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          student_email: user.email
        });

      if (joinError) throw joinError;

      toast.success(`Successfully joined ${group.name}!`);
      setCode("");
      onOpenChange(false);
      onSuccess(); // Refresh dashboard

    } catch (error: any) {
      console.error(error);
      toast.error("Failed to join group");
    } finally {
      setJoining(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Join Your IPD Group</DialogTitle>
          <DialogDescription>
            Enter the 6-digit code provided by your mentor.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="code">Group Code</Label>
            <Input 
              id="code" 
              placeholder="e.g. 123456" 
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
              className="text-center text-lg tracking-widest"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleJoin} disabled={joining} className="w-full">
            {joining ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Join Group"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}