import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Loader2, Copy, Check } from "lucide-react";
import { toast } from "sonner";

const SummarizerPage = () => {
  // const [mode, setMode] = useState<"basic" | "advanced">("basic"); // Removed
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [summary, setSummary] = useState("");
  const [feedback, setFeedback] = useState("");
  const [keyThemes, setKeyThemes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  // --- Advanced Summarizer State ---
  const [buckets, setBuckets] = useState<{ id: string, name: string }[]>([]);
  const [selectedBucket, setSelectedBucket] = useState<string>("");
  const [bucketFiles, setBucketFiles] = useState<{ original_name: string, system_name: string }[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  // Fetch buckets on load
  useEffect(() => {
    const fetchBuckets = async () => {
      const { data } = await supabase.from('note_buckets').select('id, name').order('created_at');
      if (data) setBuckets(data);
    };
    fetchBuckets();
  }, []);

  // Fetch files when bucket changes
  useEffect(() => {
    if (!selectedBucket) {
      setBucketFiles([]);
      return;
    }
    const bucket = buckets.find(b => b.id === selectedBucket);
    if (bucket) {
      fetch(`/api/files?bucket=${encodeURIComponent(bucket.name)}`)
        .then(res => res.json())
        .then(data => {
          const fileList = Object.entries(data).map(([key, val]: [string, any]) => ({
            system_name: key,
            original_name: val.original_name
          }));
          setBucketFiles(fileList);
        })
        .catch(err => console.error("Error loading files:", err));
    }
  }, [selectedBucket, buckets]);

  const toggleFile = (sysName: string) => {
    setSelectedFiles(prev =>
      prev.includes(sysName)
        ? prev.filter(f => f !== sysName)
        : [...prev, sysName]
    );
  };

  const handleSummarize = async () => {
    if (!text.trim() && selectedFiles.length === 0) return;

    setIsLoading(true);
    setSummary("");
    setFeedback("");
    setKeyThemes([]);

    // Get bucket name for payload if using files
    const bucket = buckets.find(b => b.id === selectedBucket)?.name;

    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          filenames: selectedFiles,
          bucketName: bucket
        })
      });

      const data = await response.json();
      if (response.ok) {
        setSummary(data.summary);
        setFeedback(data.feedback);
        setKeyThemes(data.key_themes || []);
      } else {
        toast.error(data.error || "Failed to generate summary");
      }
    } catch (error) {
      console.error("Error fetching summary:", error);
      toast.error("Failed to generate summary");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DashboardLayout>
      <div className="animate-fade-in max-w-4xl mx-auto p-4 md:p-6">
        <div className="mb-8">
          <h1 className="section-title mb-2">Summarize Text & Documents</h1>
          <p className="section-subtitle">Condense notes or uploaded documents into key takeaways</p>
        </div>

        <div className="glass-card p-6 md:p-8">

          {/* --- Input Method Tabs --- */}
          <Tabs defaultValue="text" className="w-full mb-8">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="text" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                <FileText className="w-4 h-4 mr-2" />
                Paste Text
              </TabsTrigger>
              <TabsTrigger value="documents" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                <Copy className="w-4 h-4 mr-2" />
                From Documents
              </TabsTrigger>
            </TabsList>

            <TabsContent value="text" className="animate-in fade-in-50 duration-300">
              <label className="block text-sm font-medium text-foreground mb-3">
                Paste your text below
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste content here (min 300 items)..."
                className="input-field min-h-[300px] resize-y text-sm p-4 leading-relaxed"
                disabled={selectedFiles.length > 0}
              />
              <p className="text-xs text-muted-foreground mt-2 text-right">
                {text.length} characters
              </p>
            </TabsContent>

            <TabsContent value="documents" className="animate-in fade-in-50 duration-300">
              <div className="bg-secondary/20 p-6 rounded-xl border border-white/5">
                <div className="mb-6">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Select a Knowledge Bucket
                  </label>
                  <select
                    className="input-field py-2.5 px-4 text-sm bg-background/50 w-full"
                    value={selectedBucket}
                    onChange={(e) => setSelectedBucket(e.target.value)}
                  >
                    <option value="">-- Choose Category --</option>
                    {buckets.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                {selectedBucket && (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                      Available Files
                    </label>
                    {bucketFiles.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground bg-black/20 rounded-lg border border-dashed border-white/10">
                        <p>No files in this bucket.</p>
                      </div>
                    ) : (
                      bucketFiles.map(file => (
                        <div
                          key={file.system_name}
                          onClick={() => toggleFile(file.system_name)}
                          className={`
                            flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                            ${selectedFiles.includes(file.system_name)
                              ? "bg-primary/10 border-primary/30 shadow-sm"
                              : "bg-background/20 border-transparent hover:bg-white/5"}
                          `}
                        >
                          <div className={`
                            w-5 h-5 rounded flex items-center justify-center border transition-colors
                            ${selectedFiles.includes(file.system_name)
                              ? "bg-primary border-primary text-primary-foreground"
                              : "border-muted-foreground/30 bg-transparent"}
                          `}>
                            {selectedFiles.includes(file.system_name) && <Check className="w-3.5 h-3.5" />}
                          </div>
                          <span className="text-sm font-medium text-foreground/90 select-none">
                            {file.original_name}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
          <button
            onClick={handleSummarize}
            disabled={(!text.trim() && selectedFiles.length === 0) || isLoading}
            className="btn-primary min-w-[150px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                Analyzing...
              </>
            ) : (
              "Summarize Selected"
            )}
          </button>


          {
            summary && (
              <div className="mt-8 pt-8 border-t border-border/50 animate-fade-in">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-foreground">Analysis Result</h3>
                  <button
                    onClick={handleCopy}
                    className="btn-secondary py-1.5 px-3 text-sm flex items-center gap-2"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>

                {/* Key Themes Section */}
                {keyThemes.length > 0 && (
                  <div className="mb-6 p-5 rounded-xl bg-purple-500/10 border border-purple-500/20">
                    <h4 className="text-sm font-bold text-purple-200 mb-3 uppercase tracking-wider">Key Themes</h4>
                    <ul className="space-y-2">
                      {keyThemes.map((theme, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-foreground/90">
                          <span className="bg-purple-500/40 rounded-full p-1 mt-0.5 min-w-[6px] min-h-[6px]" />
                          {theme}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="p-5 rounded-xl bg-secondary/30 mb-4">
                  <h4 className="text-sm font-bold text-foreground mb-2 uppercase tracking-wider">Detailed Summary</h4>
                  <p className="text-foreground text-sm leading-relaxed whitespace-pre-line">
                    {summary}
                  </p>
                </div>

                {/* Fallback for simple feedback */}
                {typeof feedback === 'string' && feedback && (
                  <div className="p-4 rounded-xl bg-blue-50/10 border border-blue-500/20">
                    <h4 className="text-sm font-semibold mb-1">AI Insight</h4>
                    <p className="text-sm text-muted-foreground">{feedback}</p>
                  </div>
                )}
              </div>
            )
          }
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SummarizerPage;
