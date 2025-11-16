import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Task, mockUsers } from "@/lib/mockData";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Calendar, Paperclip } from "lucide-react";
import { format } from "date-fns";

interface KanbanCardProps {
  task: Task;
  isDragging?: boolean;
}

export function KanbanCard({ task, isDragging }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || isSortableDragging ? 0.5 : 1,
  };

  const assignedUsers = mockUsers.filter((u) => task.assignees.includes(u.id));
  const isOverdue = new Date(task.dueDate) < new Date();

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab bg-card p-3 active:cursor-grabbing"
    >
      <h4 className="mb-2 font-medium text-card-foreground">{task.title}</h4>
      <p className="mb-3 text-xs text-muted-foreground line-clamp-2">
        {task.description}
      </p>

      <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
        <Calendar className="h-3 w-3" />
        <span className={isOverdue ? "text-destructive font-medium" : ""}>
          {format(new Date(task.dueDate), "MMM dd, yyyy")}
        </span>
        {task.files && (
          <>
            <Paperclip className="ml-2 h-3 w-3" />
            <span>{task.files.length}</span>
          </>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex -space-x-2">
          {assignedUsers.slice(0, 3).map((user) => (
            <Avatar key={user.id} className="h-6 w-6 border-2 border-background">
              <AvatarFallback className="text-xs">{user.avatar}</AvatarFallback>
            </Avatar>
          ))}
          {assignedUsers.length > 3 && (
            <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-muted text-xs">
              +{assignedUsers.length - 3}
            </div>
          )}
        </div>

        <Badge variant="outline" className="text-xs">
          Sem {task.semester}
        </Badge>
      </div>
    </Card>
  );
}
