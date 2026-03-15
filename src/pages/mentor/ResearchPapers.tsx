import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Loader2, MessageSquare, Pencil, Save } from "lucide-react";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import DOMPurify from "dompurify";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function ResearchPapers() {
    const [loading, setLoading] = useState(true);
    const [papers, setPapers] = useState<any[]>([]);

    useEffect(() => {
        // In a real app with a proper backend, we would hit a Supabase table.
        // Here we load from the persisted localStorage key used by StudentResearch.
        const saved = localStorage.getItem("student_research_papers");
        if (saved) {
            try {
                setPapers(JSON.parse(saved));
            } catch (e) { }
        }
        setLoading(false);
    }, []);

    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
    const [selectedPaper, setSelectedPaper] = useState<any>(null);
    const [feedbackInput, setFeedbackInput] = useState("");
    const [saving, setSaving] = useState(false);

    const openFeedbackModal = (paper: any) => {
        setSelectedPaper(paper);
        setFeedbackInput(paper.feedback || "");
        setIsFeedbackOpen(true);
    };

    const handleSaveFeedback = () => {
        if (!selectedPaper) return;
        setSaving(true);
        try {
            const updatedPapers = papers.map(p =>
                p.id === selectedPaper.id ? { ...p, feedback: feedbackInput } : p
            );
            setPapers(updatedPapers);
            localStorage.setItem("student_research_papers", JSON.stringify(updatedPapers));
            toast.success("Feedback saved successfully!");
            setIsFeedbackOpen(false);
        } catch (error) {
            toast.error("Failed to save feedback");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Student Research Papers</h1>
                    <p className="text-muted-foreground">Review published research papers from your students.</p>
                </div>

                {papers.length === 0 ? (
                    <div className="text-center p-12 bg-muted/20 border-border/50 rounded-lg border border-dashed flex flex-col items-center justify-center min-h-[400px]">
                        <div className="bg-background p-4 rounded-full shadow-sm mb-4">
                            <BookOpen className="h-12 w-12 text-primary/60" />
                        </div>
                        <h4 className="text-xl font-semibold text-foreground mb-2">No Papers Published Yet</h4>
                        <p className="text-muted-foreground max-w-md mx-auto">
                            None of your students have published a research paper draft yet. When they do, it will appear here.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {papers.map((paper, idx) => (
                            <Card key={paper.id || idx} className="shadow-sm border-border/50">
                                <CardHeader className="pb-3 flex flex-row items-start justify-between">
                                    <div>
                                        <CardTitle className="text-2xl mb-2">{paper.title || "Untitled Paper"}</CardTitle>
                                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1 font-medium text-foreground">
                                                <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs mr-1">
                                                    {paper.author ? paper.author[0].toUpperCase() : "S"}
                                                </span>
                                                {paper.author || "Unknown Student"}
                                            </span>
                                            <span>•</span>
                                            <span>{format(new Date(paper.date), "MMMM dd, yyyy")}</span>
                                        </div>
                                    </div>
                                    <Badge className="bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary">
                                        Published
                                    </Badge>
                                </CardHeader>
                                    <div
                                        className="prose prose-sm dark:prose-invert max-w-none pt-4 border-t border-border/50"
                                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(paper.content) }}
                                    />
                                </CardContent>
                                <CardFooter className="bg-muted/20 border-t border-border/50 flex flex-col items-start gap-4 p-4">
                                    <div className="w-full">
                                        <h5 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                            <MessageSquare className="h-4 w-4" /> Mentor Feedback
                                        </h5>
                                        {paper.feedback ? (
                                            <p className="text-sm text-muted-foreground bg-background p-3 rounded-md border text-left">
                                                {paper.feedback}
                                            </p>
                                        ) : (
                                            <p className="text-sm text-muted-foreground italic mb-2">No feedback provided yet.</p>
                                        )}
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => openFeedbackModal(paper)}>
                                        <Pencil className="h-4 w-4 mr-2" />
                                        {paper.feedback ? "Edit Feedback" : "Add Feedback"}
                                    </Button>
                                </CardFooter>
                            </Card>
                ))}
            </div>
                )}

            {/* Feedback Modal */}
            <Dialog open={isFeedbackOpen} onOpenChange={setIsFeedbackOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Provide Feedback</DialogTitle>
                        <DialogDescription>
                            Add constructive feedback for the research paper: <b>{selectedPaper?.title}</b>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea
                            placeholder="This is a great start. Consider adding more citations in the related work section..."
                            value={feedbackInput}
                            onChange={(e) => setFeedbackInput(e.target.value)}
                            className="min-h-[150px]"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsFeedbackOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveFeedback} disabled={saving}>
                            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save Feedback
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
        </DashboardLayout >
    );
}
