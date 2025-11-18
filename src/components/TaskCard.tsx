import { useState } from "react";
import { supabase } from "@/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Upload, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

// Define the Task type matching our Database
interface Task {
  id: string;
  title: string;
  due_date: string;
  status: string;
}

export function TaskCard({ task }: { task: Task }) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    
    const file = event.target.files[0];
    setUploading(true);

    try {
      if (!user) throw new Error("User not found");

      // 1. Upload File to Supabase Storage
      // Path: assignments/task_id/user_id/filename
      const filePath = `${task.id}/${user.id}/${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('assignments')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('assignments')
        .getPublicUrl(filePath);

      // 3. Save Record to Database
      const { error: dbError } = await supabase
        .from('submissions')
        .insert({
          task_id: task.id,
          student_id: user.id,
          file_name: file.name,
          file_url: publicUrl
        });

      if (dbError) throw dbError;

      toast.success("Assignment uploaded successfully!");
      setSubmitted(true);

    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  // Calculate if overdue
  const isOverdue = new Date(task.due_date) < new Date();

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold">{task.title}</CardTitle>
          {isOverdue && !submitted && (
            <AlertCircle className="h-5 w-5 text-red-500" />
          )}
        </div>
        <div className="text-sm text-muted-foreground flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {new Date(task.due_date).toLocaleDateString()}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mt-2">
           {submitted ? (
             <Badge variant="default" className="bg-green-500">Submitted</Badge>
           ) : (
             <Badge variant="outline">{task.status}</Badge>
           )}
        </div>
      </CardContent>
      <CardFooter>
        {submitted ? (
          <Button className="w-full bg-green-600 hover:bg-green-700" disabled>
            <CheckCircle className="mr-2 h-4 w-4" /> Uploaded
          </Button>
        ) : (
          <div className="w-full">
             <input
              type="file"
              id={`file-${task.id}`}
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploading}
            />
            <label htmlFor={`file-${task.id}`}>
              <Button 
                className="w-full cursor-pointer" 
                disabled={uploading}
                asChild
              >
                <span>
                  {uploading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  {uploading ? "Uploading..." : "Upload Assignment"}
                </span>
              </Button>
            </label>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}