import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Copy } from "lucide-react";

interface CreateGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateGroupModal({ open, onOpenChange }: CreateGroupModalProps) {
  const [groupName, setGroupName] = useState("");
  const [semester, setSemester] = useState("");
  const [students, setStudents] = useState("");
  const [coMentor, setCoMentor] = useState("");

  const generateCode = () => {
    return Array.from({ length: 6 }, () => 
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(Math.random() * 36)]
    ).join("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const joinCode = generateCode();
    
    toast.success("Group created!", {
      description: (
        <div className="flex items-center gap-2">
          <span>Join Code: {joinCode}</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              navigator.clipboard.writeText(joinCode);
              toast.success("Code copied!");
            }}
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      ),
    });
    
    setGroupName("");
    setSemester("");
    setStudents("");
    setCoMentor("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Group</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="groupName">Group Name</Label>
            <Input
              id="groupName"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g., Team Alpha"
              required
            />
          </div>

          <div>
            <Label htmlFor="semester">Start Semester</Label>
            <Select value={semester} onValueChange={setSemester} required>
              <SelectTrigger>
                <SelectValue placeholder="Select semester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">Semester 3</SelectItem>
                <SelectItem value="4">Semester 4</SelectItem>
                <SelectItem value="5">Semester 5</SelectItem>
                <SelectItem value="6">Semester 6</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="students">Add Students (4-5)</Label>
            <Input
              id="students"
              value={students}
              onChange={(e) => setStudents(e.target.value)}
              placeholder="Enter student emails"
              required
            />
          </div>

          <div>
            <Label htmlFor="coMentor">Assign Co-Mentor</Label>
            <Input
              id="coMentor"
              value={coMentor}
              onChange={(e) => setCoMentor(e.target.value)}
              placeholder="Enter mentor email"
            />
          </div>

          <Button type="submit" className="w-full">
            Create Group
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
