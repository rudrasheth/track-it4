import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, BookOpen, ExternalLink, Loader2, Star, Save, Upload, FileText, Plus, PenTool } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useAuth } from "@/contexts/AuthContext";

// The API key user provided
const API_KEY = "b9179c833547d648ca882e6ddd0c81ce433d83e7b534aaf884f6ee609d7ec700";

const DEFAULT_PAPERS = [
    {
        title: "Attention Is All You Need",
        link: "https://arxiv.org/abs/1706.03762",
        snippet: "The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.",
        publication_info: { summary: "A Vaswani, N Shazeer, N Parmar... - Advances in neural ..., 2017 - proceedings.neurips.cc" }
    },
    {
        title: "Deep Residual Learning for Image Recognition",
        link: "https://arxiv.org/abs/1512.03385",
        snippet: "Deeper neural networks are more difficult to train. We present a residual learning framework to ease the training of networks that are substantially deeper than those used previously. We explicitly reformulate the layers as learning residual functions with reference to the layer inputs, instead of learning unreferenced functions.",
        publication_info: { summary: "K He, X Zhang, S Ren, J Sun - Proceedings of the IEEE ..., 2016 - computer.org" }
    },
    {
        title: "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding",
        link: "https://arxiv.org/abs/1810.04805",
        snippet: "We introduce a new language representation model called BERT, which stands for Bidirectional Encoder Representations from Transformers. Unlike recent language representation models, BERT is designed to pre-train deep bidirectional representations from unlabeled text by jointly conditioning on both left and right context in all layers.",
        publication_info: { summary: "J Devlin, MW Chang, K Lee... - arXiv preprint arXiv ..., 2018 - arxiv.org" }
    }
];

const PAPER_TEMPLATE = `
  <h1>Research Paper Title</h1>
  <br/>
  <h2>Abstract</h2>
  <p>Provide a brief summary of your research objectives, methodology, key results, and conclusion...</p>
  <br/>
  <h2>1. Introduction</h2>
  <p>Detail the background and motivation for this work. What is the problem you are trying to solve?</p>
  <br/>
  <h2>2. Related Work</h2>
  <p>Discuss similar research and existing literature...</p>
  <br/>
  <h2>3. Methodology</h2>
  <p>Explain your approach, datasets, and the methods used...</p>
  <br/>
  <h2>4. Results & Discussion</h2>
  <p>Present your findings conceptually and discuss their significance...</p>
  <br/>
  <h2>5. Conclusion</h2>
  <p>Summarize the impact and future work directions...</p>
  <br/>
  <h2>References</h2>
  <p>[1] Reference goes here...</p>
`;

export default function StudentResearch() {
    const { user } = useAuth();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState(DEFAULT_PAPERS);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [starred, setStarred] = useState<Map<string, any>>(new Map());

    // Editor state
    const [isEditing, setIsEditing] = useState(false);
    const [editorTitle, setEditorTitle] = useState("");
    const [editorContent, setEditorContent] = useState("");
    const [publishedPapers, setPublishedPapers] = useState<any[]>([]);

    useEffect(() => {
        const saved = localStorage.getItem("student_research_papers");
        if (saved) {
            try { setPublishedPapers(JSON.parse(saved)); } catch (e) { }
        }
    }, []);

    const savePaper = () => {
        if (!editorTitle.trim()) { toast.error("Please enter a title for your paper"); return; }

        const newPaper = {
            id: Date.now().toString(),
            title: editorTitle,
            content: editorContent,
            date: new Date().toISOString(),
            status: "published",
            author: user?.email || "Unknown Student"
        };
        const updated = [newPaper, ...publishedPapers];
        setPublishedPapers(updated);
        localStorage.setItem("student_research_papers", JSON.stringify(updated));

        setIsEditing(false);
        setEditorTitle("");
        setEditorContent("");
        toast.success("Research paper published to your mentor successfully!");
    };

    const handleStartTemplate = () => {
        setEditorTitle("New Research Paper Draft");
        setEditorContent(PAPER_TEMPLATE);
        setIsEditing(true);
    };

    const handleStartBlank = () => {
        setEditorTitle("");
        setEditorContent("");
        setIsEditing(true);
    };

    const toggleStar = (paper: any) => {
        setStarred(prev => {
            const newMap = new Map(prev);
            if (newMap.has(paper.link)) newMap.delete(paper.link);
            else newMap.set(paper.link, paper);
            return newMap;
        });
    };

    const handleSearch = async (eContext?: React.FormEvent) => {
        if (eContext) eContext.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setError("");

        try {
            const targetUrl = `https://serpapi.com/search.json?engine=google_scholar&q=${encodeURIComponent(query)}&api_key=${API_KEY}`;
            const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;

            const response = await fetch(proxyUrl);
            if (!response.ok) {
                throw new Error("Failed to fetch research papers.");
            }

            const data = await response.json();

            if (data.organic_results) {
                setResults(data.organic_results);
            } else {
                setResults([]);
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || "An error occurred while fetching papers.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <BookOpen className="h-8 w-8 text-primary" />
                        Research Papers
                    </h1>
                    <p className="text-muted-foreground mt-1">Discover academic papers and literature for your projects.</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Search Topics</CardTitle>
                        <CardDescription>Enter a topic or keywords to find related scholarly articles.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <Input
                                placeholder="e.g. Machine Learning in Healthcare..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="max-w-xl"
                            />
                            <Button type="submit" disabled={loading || !query.trim()}>
                                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                                Search
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Tabs defaultValue="search" className="space-y-6 mt-8">
                    <TabsList>
                        <TabsTrigger value="search">Search Papers</TabsTrigger>
                        <TabsTrigger value="starred" className="relative">
                            Starred Library
                            {starred.size > 0 && (
                                <span className="ml-2 inline-flex items-center justify-center bg-primary text-primary-foreground text-[10px] w-5 h-5 rounded-full">
                                    {starred.size}
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="my-papers">My Research Papers</TabsTrigger>
                    </TabsList>

                    <TabsContent value="search" className="space-y-4">
                        <h3 className="text-xl font-semibold mb-4">
                            {results === DEFAULT_PAPERS ? "Recommended Reading" : "Search Results"}
                        </h3>

                        {error && <div className="text-destructive font-medium p-4 bg-destructive/10 rounded-md">{error}</div>}

                        {!loading && results.length === 0 && !error && (
                            <div className="text-center p-8 bg-muted/20 rounded-lg border border-dashed">
                                <p className="text-muted-foreground">No papers found for "{query}". Try different keywords.</p>
                            </div>
                        )}

                        {loading ? (
                            <div className="flex justify-center p-12">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            results.map((paper: any, idx: number) => (
                                <Card key={idx} className="overflow-hidden hover:border-primary/50 transition-colors">
                                    <CardContent className="p-6">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="space-y-2">
                                                <h4 className="text-lg font-bold leading-tight">
                                                    <a href={paper.link} target="_blank" rel="noopener noreferrer" className="hover:underline text-foreground">
                                                        {paper.title}
                                                    </a>
                                                </h4>
                                                {paper.publication_info?.summary && (
                                                    <p className="text-sm font-medium text-emerald-600 dark:text-emerald-500">
                                                        {paper.publication_info.summary}
                                                    </p>
                                                )}
                                                {paper.snippet && (
                                                    <p className="text-sm text-muted-foreground line-clamp-3">
                                                        {paper.snippet}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-2 shrink-0">
                                                {paper.link && (
                                                    <Button variant="outline" size="sm" className="hidden sm:flex" asChild>
                                                        <a href={paper.link} target="_blank" rel="noopener noreferrer">
                                                            <ExternalLink className="h-4 w-4 mr-2" /> Read
                                                        </a>
                                                    </Button>
                                                )}
                                                {paper.link && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="hidden sm:flex"
                                                        onClick={(e) => { e.preventDefault(); toggleStar(paper); }}
                                                    >
                                                        <Star className={`h-4 w-4 mr-2 ${starred.has(paper.link) ? "fill-yellow-400 text-yellow-500" : ""}`} />
                                                        {starred.has(paper.link) ? "Starred" : "Star"}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </TabsContent>

                    <TabsContent value="starred" className="space-y-4">
                        <h3 className="text-xl font-semibold mb-4">Your Starred Papers</h3>
                        {starred.size === 0 ? (
                            <div className="text-center p-8 bg-muted/20 rounded-lg border border-dashed">
                                <Star className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                                <p className="text-muted-foreground">You haven't starred any papers yet.</p>
                            </div>
                        ) : (
                            Array.from(starred.values()).map((paper: any, idx: number) => (
                                <Card key={idx} className="overflow-hidden hover:border-primary/50 transition-colors">
                                    <CardContent className="p-6">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="space-y-2">
                                                <h4 className="text-lg font-bold leading-tight">
                                                    <a href={paper.link} target="_blank" rel="noopener noreferrer" className="hover:underline text-foreground">
                                                        {paper.title}
                                                    </a>
                                                </h4>
                                                {paper.publication_info?.summary && (
                                                    <p className="text-sm font-medium text-emerald-600 dark:text-emerald-500">
                                                        {paper.publication_info.summary}
                                                    </p>
                                                )}
                                                {paper.snippet && (
                                                    <p className="text-sm text-muted-foreground line-clamp-3">
                                                        {paper.snippet}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-2 shrink-0">
                                                {paper.link && (
                                                    <Button variant="outline" size="sm" className="hidden sm:flex" asChild>
                                                        <a href={paper.link} target="_blank" rel="noopener noreferrer">
                                                            <ExternalLink className="h-4 w-4 mr-2" /> Read
                                                        </a>
                                                    </Button>
                                                )}
                                                {paper.link && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="hidden sm:flex"
                                                        onClick={(e) => { e.preventDefault(); toggleStar(paper); }}
                                                    >
                                                        <Star className={`h-4 w-4 mr-2 ${starred.has(paper.link) ? "fill-yellow-400 text-yellow-500" : ""}`} />
                                                        {starred.has(paper.link) ? "Starred" : "Star"}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </TabsContent>

                    <TabsContent value="my-papers" className="space-y-4">
                        {isEditing ? (
                            <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xl font-semibold">Research Paper Editor</h3>
                                    <div className="flex gap-2">
                                        <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                                        <Button onClick={savePaper}>
                                            <Save className="h-4 w-4 mr-2" />
                                            Publish to Mentor
                                        </Button>
                                    </div>
                                </div>
                                <div className="space-y-4 bg-card rounded-lg border p-4 shadow-sm">
                                    <div>
                                        <label className="text-sm font-medium mb-1 block">Paper Title</label>
                                        <Input
                                            value={editorTitle}
                                            onChange={e => setEditorTitle(e.target.value)}
                                            placeholder="Enter your paper's title..."
                                            className="text-lg font-semibold h-12"
                                        />
                                    </div>
                                    <div className="bg-background rounded-md pb-12">
                                        <ReactQuill
                                            theme="snow"
                                            value={editorContent}
                                            onChange={setEditorContent}
                                            className="h-[500px]"
                                            placeholder="Write your research paper here..."
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4 animate-in fade-in duration-300">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-semibold">Your Published & Draft Papers</h3>
                                    <div className="flex gap-2">
                                        <Button variant="outline" onClick={handleStartBlank} className="hidden sm:flex">
                                            <PenTool className="h-4 w-4 mr-2" />
                                            Blank Draft
                                        </Button>
                                        <Button onClick={handleStartTemplate}>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Use Template
                                        </Button>
                                    </div>
                                </div>

                                {publishedPapers.length === 0 ? (
                                    <div className="text-center p-12 bg-muted/20 rounded-lg border border-dashed flex flex-col items-center justify-center min-h-[400px]">
                                        <div className="bg-background p-4 rounded-full shadow-sm mb-4">
                                            <FileText className="h-12 w-12 text-primary/60" />
                                        </div>
                                        <h4 className="text-xl font-semibold text-foreground mb-2">No Papers Authored</h4>
                                        <p className="text-muted-foreground max-w-md mx-auto mb-6">
                                            You haven't authored any research papers or drafts yet. Use an industry-standard template to start drafting your first research piece for mentor review.
                                        </p>
                                        <div className="flex gap-3">
                                            <Button variant="outline" onClick={handleStartBlank}>
                                                Start Blank Draft
                                            </Button>
                                            <Button variant="default" onClick={handleStartTemplate}>
                                                <Plus className="h-4 w-4 mr-2" />
                                                Start from Template
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                        {publishedPapers.map((paper, idx) => (
                                            <Card key={paper.id || idx} className="group relative hover:border-primary/50 transition-colors shadow-sm">
                                                <CardContent className="p-6 flex flex-col h-full">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <Badge variant="default" className="bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary mb-2 border-primary/20">Published</Badge>
                                                    </div>
                                                    <h4 className="font-bold text-lg mb-2 line-clamp-2">{paper.title}</h4>
                                                    <p className="text-xs text-muted-foreground mb-6 flex-grow">
                                                        Published on: {new Date(paper.date).toLocaleDateString()}
                                                    </p>
                                                    <div className="flex gap-2 mt-auto pt-4 border-t border-border/50">
                                                        <Button variant="outline" size="sm" className="w-full" onClick={() => {
                                                            setEditorTitle(paper.title);
                                                            setEditorContent(paper.content);
                                                            setIsEditing(true);
                                                        }}>
                                                            <PenTool className="h-3 w-3 mr-2" />
                                                            View / Edit
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}
