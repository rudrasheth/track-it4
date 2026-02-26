import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/supabaseClient";
import { format, isPast } from "date-fns";
import { Loader2, Clock, AlertCircle, CheckSquare, Tag, User } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { JiraTaskModal } from "@/components/JiraTaskModal";

interface KanbanBoardProps { groupId: string; }

const COLUMNS = [
  { id: "todo", title: "To Do", color: "border-t-4 border-t-slate-400 bg-slate-50/30" },
  { id: "in-progress", title: "In Progress", color: "border-t-4 border-t-blue-400 bg-blue-50/30" },
  { id: "done", title: "Done", color: "border-t-4 border-t-green-400 bg-green-50/30" },
];

export function KanbanBoard({ groupId }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchTasks = async () => {
    const { data } = await supabase.from("tasks").select("*, profiles(full_name)").eq("group_id", groupId).order("created_at", { ascending: false });
    setTasks(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
    const sub = supabase.channel("public:tasks").on("postgres_changes", { event: "*", schema: "public", table: "tasks", filter: `group_id=eq.${groupId}` }, () => fetchTasks()).subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [groupId]);

  const onDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    if (!draggedTaskId) return;
    const original = [...tasks];
    setTasks((prev) => prev.map((t) => (t.id === draggedTaskId ? { ...t, status: newStatus } : t)));
    try {
      await supabase.from("tasks").update({ status: newStatus }).eq("id", draggedTaskId);
    } catch (err) {
      toast.error("Failed to move");
      setTasks(original);
    }
    setDraggedTaskId(null);
  };

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto" /></div>;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[400px] overflow-x-auto p-2">
        {COLUMNS.map((col) => (
          <div key={col.id} className={`rounded-lg p-3 flex flex-col gap-3 border h-full ${col.color}`}
            onDragOver={(e) => e.preventDefault()} onDrop={(e) => onDrop(e, col.id)}>

            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-xs uppercase text-slate-600 tracking-wider">{col.title}</h3>
              <Badge variant="secondary" className="bg-white text-slate-700">{tasks.filter(t => t.status === col.id).length}</Badge>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
              {tasks.filter((t) => t.status === col.id).map((task) => {
                const isOverdue = isPast(new Date(task.due_date)) && task.status !== 'done';
                const completedSubs = task.subtasks?.filter((s: any) => s.completed).length || 0;
                const totalSubs = task.subtasks?.length || 0;

                return (
                  <Card key={task.id} draggable onDragStart={() => setDraggedTaskId(task.id)} onClick={() => { setSelectedTask(task); setIsModalOpen(true); }}
                    className="cursor-pointer hover:shadow-md transition-all bg-white group hover:border-primary">
                    <CardContent className="p-3 space-y-3">

                      {/* Labels */}
                      {task.labels && task.labels.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {task.labels.map((l: string) => <span key={l} className="text-[9px] uppercase font-bold text-muted-foreground bg-muted px-1 rounded">{l}</span>)}
                        </div>
                      )}

                      <div className="font-medium text-sm leading-snug">{task.title}</div>

                      <div className="flex items-center justify-between pt-2 border-t border-dashed">
                        <div className="flex items-center gap-3">
                          {/* Priority Icon */}
                          {task.priority === 'high' && <AlertCircle className="h-4 w-4 text-red-500" />}
                          {task.priority === 'medium' && <AlertCircle className="h-4 w-4 text-yellow-500" />}
                          {task.priority === 'low' && <AlertCircle className="h-4 w-4 text-green-500" />}

                          {/* Subtask Count */}
                          {totalSubs > 0 && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground" title="Subtasks">
                              <CheckSquare className="h-3 w-3" /> {completedSubs}/{totalSubs}
                            </div>
                          )}
                        </div>

                        {/* Avatar */}
                        {task.profiles?.full_name && (
                          <Avatar className="h-5 w-5 ring-1 ring-white">
                            <AvatarFallback className="text-[9px] bg-primary text-primary-foreground">{task.profiles.full_name[0]}</AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <JiraTaskModal task={selectedTask} open={isModalOpen} onOpenChange={setIsModalOpen} onUpdate={fetchTasks} />
    </>
  );
}