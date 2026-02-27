import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, BookOpen, ExternalLink, Loader2, Star, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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

export default function StudentResearch() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState(DEFAULT_PAPERS);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [starred, setStarred] = useState<Set<string>>(new Set());

    const toggleStar = (link: string) => {
        setStarred(prev => {
            const newSet = new Set(prev);
            if (newSet.has(link)) newSet.delete(link);
            else newSet.add(link);
            return newSet;
        });
    };

    const handleSaveDraft = (paperTitle: string) => {
        // Mock save draft functionality for mentor review
        toast.success(`"${paperTitle}" saved as draft for mentor review!`, {
            description: "Your mentor will be able to review this research paper draft.",
            icon: <Save className="h-4 w-4 text-green-500" />
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

                <div className="space-y-4">
                    <h3 className="text-xl font-semibold mt-8 mb-4">
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
                                                    onClick={(e) => { e.preventDefault(); toggleStar(paper.link); }}
                                                >
                                                    <Star className={`h-4 w-4 mr-2 ${starred.has(paper.link) ? "fill-yellow-400 text-yellow-500" : ""}`} />
                                                    {starred.has(paper.link) ? "Starred" : "Star"}
                                                </Button>
                                            )}
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="hidden sm:flex bg-primary/10 text-primary hover:bg-primary/20"
                                                onClick={(e) => { e.preventDefault(); handleSaveDraft(paper.title); }}
                                            >
                                                <Save className="h-4 w-4 mr-2" /> Save Draft for Mentor
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
