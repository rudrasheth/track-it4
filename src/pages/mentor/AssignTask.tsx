import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { supabase } from "@/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

interface Group {
  id: string;
  name: string;
}

export default function AssignTask() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // State for Groups List
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    due_date: ""
  });

  // Fetch the Mentor's Groups on Load
  useEffect(() => {
    const fetchGroups = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('groups')
        .select('id, name')
        .eq('created_by', user.id); // Only show groups created by this mentor
      
      if (error) console.error("Error fetching groups:", error);
      else setGroups(data || []);
    };
    fetchGroups();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedGroup) {
      toast.error("Please select a group for this task");
      return;
    }

    setLoading(true);

    try {
      // 1. Get Current User ID
      if (!user) throw new Error("You must be logged in");

      // 2. Insert Task with 'group_id'
      const { error } = await supabase
        .from('tasks')
        .insert([
          {
            title: formData.title,
            description: formData.description,
            due_date: formData.due_date,
            status: 'todo',
            created_by: user.id,
            group_id: selectedGroup // <--- IMPORTANT: Links task to the specific Group
          }
        ]);

      if (error) throw error;

      toast.success("Task assigned to group successfully!");
      navigate("/mentor/dashboard");
      
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Assign New Task</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Task Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* GROUP SELECTOR */}
              <div className="space-y-2">
                <Label htmlFor="group">Select Group</Label>
                <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a group" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.length === 0 ? (
                      <SelectItem value="none" disabled>No groups found</SelectItem>
                    ) : (
                      groups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Task Title</Label>
                <Input 
                  id="title" 
                  placeholder="e.g. Final Project Report" 
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  placeholder="Describe the requirements..." 
                  className="min-h-[100px]"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date</Label>
                <Input 
                  id="due_date" 
                  type="date" 
                  required
                  value={formData.due_date}
                  onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                />
              </div>

              <div className="pt-4">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Task...
                    </>
                  ) : (
                    "Assign Task"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}