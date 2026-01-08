import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, ExternalLink, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";

export default function StudentSubmissions() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubmissions = async () => {
      if (!user) return;
      try {
        // Fetch submissions and join with the 'tasks' table to get the Task Title
        const { data, error } = await supabase
          .from('submissions')
          .select(`
            *,
            tasks ( title, due_date )
          `)
          .eq('student_id', user.id)
          .order('submitted_at', { ascending: false });

        if (error) throw error;
        setSubmissions(data || []);
      } catch (error) {
        console.error("Error fetching submissions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [user]);

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Submission History</h1>
          <p className="text-muted-foreground">Track your submitted assignments and grades</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task Name</TableHead>
                  <TableHead>File Name</TableHead>
                  <TableHead>Submitted On</TableHead>
                  <TableHead>Feedback</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.length === 0 ? (
                  <TableRow>
                    {/* Updated colspan to 5 since we removed one column */}
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                      <FileText className="h-10 w-10 mx-auto mb-2 opacity-20" />
                      No submissions yet. Go to the Dashboard to upload work.
                    </TableCell>
                  </TableRow>
                ) : (
                  submissions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium">{sub.tasks?.title || "Unknown Task"}</TableCell>
                      <TableCell>{sub.file_name}</TableCell>
                      <TableCell>{format(new Date(sub.submitted_at), "MMM dd, yyyy")}</TableCell>
                      {/* Grade Column Removed */}
                      <TableCell className="max-w-[200px] truncate" title={sub.feedback}>
                        {sub.feedback || "-"}
                      </TableCell>
                      <TableCell>
                        <a
                          href={sub.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-blue-600 hover:underline"
                        >
                          View <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}