import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { toast } from "@/hooks/use-toast";
import { Download, FileText } from "lucide-react";
import { Submission } from "@/lib/mockData";

interface GradingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: Submission | null;
  taskTitle: string;
  onGrade: (submissionId: string, grade: number, feedback: string, rubric: any) => void;
}

export function GradingModal({ open, onOpenChange, submission, taskTitle, onGrade }: GradingModalProps) {
  const [grade, setGrade] = useState(submission?.grade?.toString() || "");
  const [feedback, setFeedback] = useState(submission?.feedback || "");
  const [designRubric, setDesignRubric] = useState(submission?.rubric?.design || "");
  const [clarityRubric, setClarityRubric] = useState(submission?.rubric?.clarity || "");

  const handleSave = () => {
    const gradeNum = parseInt(grade);
    
    if (isNaN(gradeNum) || gradeNum < 0 || gradeNum > 100) {
      toast({
        title: "Invalid Grade",
        description: "Please enter a grade between 0 and 100",
        variant: "destructive",
      });
      return;
    }

    if (!submission) return;

    onGrade(submission.id, gradeNum, feedback, {
      design: designRubric,
      clarity: clarityRubric,
    });

    toast({
      title: "Grade Saved",
      description: `Grade ${gradeNum}/100 saved for ${submission.studentName || "student"}`,
    });

    onOpenChange(false);
  };

  const handleDownload = () => {
    if (submission) {
      console.log("Downloading:", submission.fileUrl);
      toast({
        title: "Download Started",
        description: `Downloading ${submission.fileUrl}`,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Grade Submission: {taskTitle} – {submission?.studentName || "Student"}
          </DialogTitle>
        </DialogHeader>

        {submission && (
          <div className="space-y-6">
            {/* Submission Info */}
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">{submission.fileUrl}</p>
                    <p className="text-sm text-muted-foreground">
                      Submitted on {new Date(submission.submittedAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>

            {/* Grade Input */}
            <div className="space-y-2">
              <Label htmlFor="grade">Grade (0-100)</Label>
              <Input
                id="grade"
                type="number"
                min="0"
                max="100"
                placeholder="Enter grade out of 100"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
              />
            </div>

            {/* Rubric Dropdowns */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Design</Label>
                <Select value={designRubric} onValueChange={setDesignRubric}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Excellent">Excellent</SelectItem>
                    <SelectItem value="Good">Good</SelectItem>
                    <SelectItem value="Fair">Fair</SelectItem>
                    <SelectItem value="Poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Clarity</Label>
                <Select value={clarityRubric} onValueChange={setClarityRubric}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Excellent">Excellent</SelectItem>
                    <SelectItem value="Good">Good</SelectItem>
                    <SelectItem value="Fair">Fair</SelectItem>
                    <SelectItem value="Poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Feedback */}
            <div className="space-y-2">
              <Label htmlFor="feedback">Feedback</Label>
              <Textarea
                id="feedback"
                placeholder="Great use of color..."
                rows={5}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save Grade
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
