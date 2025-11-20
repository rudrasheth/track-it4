import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Trash2, Save, Loader2, Plus, CheckSquare, Tag } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress"; // Make sure to install if missing, or use simple div

// Interfaces
interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date: string;
  points: number;
  labels: string[];
  subtasks: Subtask[];
  profiles?: { full_name: string };
}

interface JiraTaskModalProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function JiraTaskModal({ task, open, onOpenChange, onUpdate }: JiraTaskModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("details");
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState<Partial<Task>>({});
  const [newSubtask, setNewSubtask] = useState("");
  const [newLabel, setNewLabel] = useState("");

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority || "medium",
        due_date: task.due_date,
        points: task.points || 0,
        labels: task.labels || [],
        subtasks: task.subtasks || []
      });
      fetchComments();
    }
  }, [task]);

  const fetchComments = async () => {
    if (!task) return;
    const { data } = await supabase.from('task_comments').select('*, profiles(full_name)').eq('task_id', task.id).order('created_at', { ascending: true });
    setComments(data || []);
  };

  const handleSave = async () => {
    if (!task) return;
    setLoading(true);
    try {
      await supabase.from('tasks').update(formData).eq('id', task.id);
      toast.success("Task updated");
      onUpdate();
      onOpenChange(false);
    } catch (error) { toast.error("Failed to update"); } finally { setLoading(false); }
  };

  // --- SUBTASKS LOGIC ---
  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    const sub: Subtask = { id: Date.now().toString(), title: newSubtask, completed: false };
    setFormData(prev => ({ ...prev, subtasks: [...(prev.subtasks || []), sub] }));
    setNewSubtask("");
  };

  const toggleSubtask = (id: string) => {
    setFormData(prev => ({
      ...prev,
      subtasks: prev.subtasks?.map(s => s.id === id ? { ...s, completed: !s.completed } : s)
    }));
  };

  const deleteSubtask = (id: string) => {
    setFormData(prev => ({
      ...prev,
      subtasks: prev.subtasks?.filter(s => s.id !== id)
    }));
  };

  // --- LABELS LOGIC ---
  const addLabel = () => {
    if (!newLabel.trim()) return;
    if (!formData.labels?.includes(newLabel)) {
        setFormData(prev => ({ ...prev, labels: [...(prev.labels || []), newLabel] }));
    }
    setNewLabel("");
  };

  const removeLabel = (label: string) => {
    setFormData(prev => ({ ...prev, labels: prev.labels?.filter(l => l !== label) }));
  };

  // --- COMMENTS LOGIC ---
  const handleAddComment = async () => {
    if (!newComment.trim() || !task || !user) return;
    await supabase.from('task_comments').insert({ task_id: task.id, user_id: user.id, content: newComment });
    setNewComment("");
    fetchComments();
  };

  const handleDelete = async () => {
    if (!task || !confirm("Delete this task?")) return;
    await supabase.from('tasks').delete().eq('id', task.id);
    onUpdate();
    onOpenChange(false);
  };

  const completedSubtasks = formData.subtasks?.filter(s => s.completed).length || 0;
  const totalSubtasks = formData.subtasks?.length || 0;
  const progress = totalSubtasks === 0 ? 0 : (completedSubtasks / totalSubtasks) * 100;

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] h-[85vh] flex flex-col p-0 gap-0 bg-background">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/20">
            <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-xs font-mono uppercase text-muted-foreground">{task.id.slice(0, 5)}</Badge>
                <Input 
                    value={formData.title || ""} 
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="border-none shadow-none font-semibold text-lg h-auto p-0 focus-visible:ring-0 bg-transparent w-[400px]"
                />
            </div>
            <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={handleDelete} className="text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
                <Button size="sm" onClick={handleSave} disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}</Button>
            </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
            {/* LEFT: Main Content */}
            <div className="flex-[2] flex flex-col p-6 overflow-y-auto gap-6">
                
                {/* Description */}
                <div className="space-y-2">
                    <h3 className="text-sm font-bold text-muted-foreground uppercase">Description</h3>
                    <Textarea 
                        value={formData.description || ""} 
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        className="min-h-[100px] bg-muted/10 resize-none focus-visible:ring-1" 
                        placeholder="Add a more detailed description..."
                    />
                </div>

                {/* Subtasks (Checklist) */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <h3 className="text-sm font-bold text-muted-foreground uppercase">Subtasks</h3>
                        <span className="text-xs text-muted-foreground">{completedSubtasks} / {totalSubtasks} done</span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                    </div>

                    <div className="space-y-2">
                        {formData.subtasks?.map(sub => (
                            <div key={sub.id} className="flex items-center gap-2 group">
                                <input 
                                    type="checkbox" 
                                    checked={sub.completed} 
                                    onChange={() => toggleSubtask(sub.id)}
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <span className={`flex-1 text-sm ${sub.completed ? "line-through text-muted-foreground" : ""}`}>{sub.title}</span>
                                <Trash2 className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 cursor-pointer hover:text-destructive" onClick={() => deleteSubtask(sub.id)} />
                            </div>
                        ))}
                        <div className="flex gap-2">
                            <Input placeholder="Add a subtask..." value={newSubtask} onChange={(e) => setNewSubtask(e.target.value)} className="h-8 text-sm" onKeyPress={(e) => e.key === 'Enter' && addSubtask()} />
                            <Button size="sm" variant="outline" onClick={addSubtask}><Plus className="h-3 w-3" /></Button>
                        </div>
                    </div>
                </div>

                {/* Comments Tab */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col mt-4">
                    <TabsList className="w-full justify-start h-auto p-0 bg-transparent border-b">
                        <TabsTrigger value="details" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 py-2">Comments</TabsTrigger>
                    </TabsList>
                    <TabsContent value="details" className="flex-1 flex flex-col gap-4 pt-4">
                        <div className="flex gap-3">
                            <Avatar className="h-8 w-8"><AvatarFallback>{user?.user_metadata?.full_name?.[0]}</AvatarFallback></Avatar>
                            <div className="flex-1 gap-2">
                                <Textarea placeholder="Add a comment..." value={newComment} onChange={(e) => setNewComment(e.target.value)} className="min-h-[60px]" />
                                <div className="flex justify-end mt-2"><Button size="sm" variant="secondary" onClick={handleAddComment}>Post</Button></div>
                            </div>
                        </div>
                        <ScrollArea className="h-[200px] pr-4">
                            <div className="space-y-4">
                                {comments.map(c => (
                                    <div key={c.id} className="flex gap-3">
                                        <Avatar className="h-8 w-8 mt-1"><AvatarFallback className="text-xs bg-blue-100 text-blue-700">{c.profiles?.full_name?.[0]}</AvatarFallback></Avatar>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold">{c.profiles?.full_name || "User"}</span>
                                                <span className="text-xs text-muted-foreground">{format(new Date(c.created_at), "MMM d, p")}</span>
                                            </div>
                                            <p className="text-sm text-foreground/90">{c.content}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </TabsContent>
                </Tabs>
            </div>

            {/* RIGHT: Sidebar */}
            <div className="w-72 border-l p-6 bg-muted/10 flex flex-col gap-6 overflow-y-auto">
                
                <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Status</label>
                    <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                        <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="todo">To Do</SelectItem><SelectItem value="in-progress">In Progress</SelectItem><SelectItem value="done">Done</SelectItem></SelectContent>
                    </Select>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Priority</label>
                    <Select value={formData.priority} onValueChange={(v) => setFormData({...formData, priority: v})}>
                        <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="high" className="text-red-600 font-bold">High</SelectItem>
                            <SelectItem value="medium" className="text-yellow-600 font-bold">Medium</SelectItem>
                            <SelectItem value="low" className="text-green-600 font-bold">Low</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Assignee</label>
                    <div className="flex items-center gap-2 p-2 bg-background rounded border">
                        <Avatar className="h-6 w-6"><AvatarFallback><User className="h-3 w-3" /></AvatarFallback></Avatar>
                        <span className="text-sm font-medium truncate">{task.profiles?.full_name || "Unassigned"}</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Labels</label>
                    <div className="flex flex-wrap gap-1 mb-2">
                        {formData.labels?.map(label => (
                            <Badge key={label} variant="secondary" className="cursor-pointer hover:bg-destructive hover:text-white" onClick={() => removeLabel(label)}>
                                {label}
                            </Badge>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <Input placeholder="Tag..." value={newLabel} onChange={(e) => setNewLabel(e.target.value)} className="h-8 bg-background" onKeyPress={(e) => e.key === 'Enter' && addLabel()} />
                        <Button size="sm" variant="outline" onClick={addLabel}><Plus className="h-3 w-3" /></Button>
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Story Points</label>
                    <Input type="number" className="bg-background" value={formData.points} onChange={(e) => setFormData({...formData, points: parseInt(e.target.value)})} />
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Due Date</label>
                    <Input type="date" className="bg-background" value={formData.due_date} onChange={(e) => setFormData({...formData, due_date: e.target.value})} />
                </div>

            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}