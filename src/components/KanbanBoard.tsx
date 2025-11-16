import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Task, mockTasks, mockUsers } from "@/lib/mockData";
import { KanbanCard } from "./KanbanCard";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { toast } from "@/hooks/use-toast";

type Column = "todo" | "in-progress" | "review" | "submitted" | "done";

const columns: { id: Column; title: string; color: string }[] = [
  { id: "todo", title: "To Do", color: "bg-muted" },
  { id: "in-progress", title: "In Progress", color: "bg-chart-3/20" },
  { id: "review", title: "Review", color: "bg-chart-1/20" },
  { id: "submitted", title: "Submitted", color: "bg-chart-4/20" },
  { id: "done", title: "Done", color: "bg-chart-2/20" },
];

interface KanbanBoardProps {
  groupId?: string;
}

export function KanbanBoard({ groupId }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>(
    groupId ? mockTasks.filter((t) => t.groupId === groupId) : mockTasks
  );
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as Column;
    const task = tasks.find((t) => t.id === taskId);

    // Don't allow dragging from done back to other columns
    if (task?.status === "done" && newStatus !== "done") {
      toast({
        title: "Cannot Move Task",
        description: "Completed tasks cannot be moved back",
        variant: "destructive",
      });
      setActiveTask(null);
      return;
    }

    setTasks((tasks) =>
      tasks.map((task) =>
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    );

    if (task && task.status !== newStatus) {
      const statusLabels: Record<Column, string> = {
        "todo": "To Do",
        "in-progress": "In Progress",
        "review": "Review",
        "submitted": "Submitted",
        "done": "Done",
      };

      toast({
        title: "Task Moved",
        description: `Task "${task.title}" moved to ${statusLabels[newStatus]}`,
      });
    }

    setActiveTask(null);
  };

  const getTasksByColumn = (columnId: Column) => {
    return tasks.filter((task) => task.status === columnId);
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {columns.map((column) => {
          const columnTasks = getTasksByColumn(column.id);

          return (
            <Card key={column.id} className={`p-4 ${column.color}`}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-foreground">{column.title}</h3>
                <Badge variant="secondary">{columnTasks.length}</Badge>
              </div>

              <SortableContext
                items={columnTasks.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
                id={column.id}
              >
                <div className="space-y-3">
                  {columnTasks.map((task) => (
                    <KanbanCard key={task.id} task={task} />
                  ))}
                  {columnTasks.length === 0 && (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      No tasks
                    </p>
                  )}
                </div>
              </SortableContext>
            </Card>
          );
        })}
      </div>

      <DragOverlay>
        {activeTask && <KanbanCard task={activeTask} isDragging />}
      </DragOverlay>
    </DndContext>
  );
}
