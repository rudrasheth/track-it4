import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Download, FileText, Award } from "lucide-react";
import { mockSubmissions, mockTasks, Submission } from "@/lib/mockData";
import { GradingModal } from "./GradingModal";

interface SubmissionsViewProps {
  groupId?: string;
}

export function SubmissionsView({ groupId }: SubmissionsViewProps) {
  const [submissions, setSubmissions] = useState<Submission[]>(mockSubmissions);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [gradingModalOpen, setGradingModalOpen] = useState(false);

  const filteredSubmissions = groupId
    ? submissions.filter((sub) => sub.groupId === groupId)
    : submissions;

  const getTaskTitle = (taskId: string) => {
    const task = mockTasks.find((t) => t.id === taskId);
    return task?.title || "Unknown Task";
  };

  const handleGradeClick = (submission: Submission) => {
    setSelectedSubmission(submission);
    setGradingModalOpen(true);
  };

  const handleGrade = (submissionId: string, grade: number, feedback: string, rubric: any) => {
    setSubmissions((prev) =>
      prev.map((sub) =>
        sub.id === submissionId
          ? { ...sub, grade, feedback, rubric }
          : sub
      )
    );
  };

  const handleDownload = (fileUrl: string) => {
    console.log("Downloading:", fileUrl);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Student Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredSubmissions.map((submission) => (
              <Card key={submission.id} className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-primary" />
                        <div>
                          <h4 className="font-semibold text-foreground">
                            {getTaskTitle(submission.taskId)}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {submission.studentName || "Student"}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <FileText className="h-4 w-4" />
                          <span>{submission.fileUrl}</span>
                        </div>
                        <div className="text-muted-foreground">
                          Submitted: {new Date(submission.submittedAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                      </div>

                      {submission.grade !== undefined ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Award className="h-4 w-4 text-green-500" />
                            <Badge className="bg-green-500/10 text-green-500">
                              Graded: {submission.grade}/100
                            </Badge>
                          </div>
                          {submission.feedback && (
                            <p className="text-sm text-muted-foreground">
                              Feedback: {submission.feedback}
                            </p>
                          )}
                          {submission.rubric && (
                            <div className="flex gap-2">
                              {submission.rubric.design && (
                                <Badge variant="outline">Design: {submission.rubric.design}</Badge>
                              )}
                              {submission.rubric.clarity && (
                                <Badge variant="outline">Clarity: {submission.rubric.clarity}</Badge>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <Badge variant="outline">Pending Review</Badge>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(submission.fileUrl)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleGradeClick(submission)}
                      >
                        {submission.grade !== undefined ? "Edit Grade" : "Grade & Feedback"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredSubmissions.length === 0 && (
              <div className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Submissions Yet</h3>
                <p className="text-muted-foreground">
                  Students haven't submitted any assignments yet.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <GradingModal
        open={gradingModalOpen}
        onOpenChange={setGradingModalOpen}
        submission={selectedSubmission}
        taskTitle={selectedSubmission ? getTaskTitle(selectedSubmission.taskId) : ""}
        onGrade={handleGrade}
      />
    </>
  );
}
