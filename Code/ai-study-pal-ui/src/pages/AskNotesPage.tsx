import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { MessageSquare, Loader2, FileStack, Send } from "lucide-react";

const subjects = ["All Notes", "Mathematics", "Physics", "Chemistry", "Biology", "History"];

const AskNotesPage = () => {
  const [question, setQuestion] = useState("");
  const [subject, setSubject] = useState("All Notes");
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<Array<{ question: string; answer: string; sources: string[] }>>([]);

  const handleAsk = async () => {
    if (!question.trim()) return;

    setIsLoading(true);
    const currentQuestion = question;
    setQuestion("");

    try {
      const response = await fetch('/api/ask-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: currentQuestion, subject })
      });
      const data = await response.json();

      const newEntry = {
        question: currentQuestion,
        answer: data.answer,
        sources: data.sources && data.sources.length > 0 ? data.sources : ["General Knowledge"],
      };
      setHistory([newEntry, ...history]);
    } catch (error) {
      console.error("RAG Error:", error);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        <div className="mb-8">
          <h1 className="section-title mb-2">Ask My Notes</h1>
          <p className="section-subtitle">Get answers from your uploaded study materials</p>
        </div>

        <div className="glass-card p-6 md:p-8">
          {/* Input area */}
          <div className="mb-6">
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-foreground mb-2">
                  <MessageSquare className="w-4 h-4 inline mr-2" />
                  Your Question
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="e.g., What is the Pythagorean theorem?"
                    className="input-field pr-12"
                    onKeyDown={(e) => e.key === "Enter" && handleAsk()}
                  />
                  <button
                    onClick={handleAsk}
                    disabled={!question.trim() || isLoading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="w-40">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Filter
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="input-field"
                >
                  {subjects.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="p-6 rounded-xl bg-secondary/30 mb-4 animate-pulse">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="text-muted-foreground">Searching your notes...</span>
              </div>
            </div>
          )}

          {/* History */}
          {history.length > 0 ? (
            <div className="space-y-4">
              {history.map((entry, index) => (
                <div key={index} className="rounded-xl bg-accent/20 overflow-hidden animate-fade-in">
                  <div className="p-4 bg-secondary/30">
                    <p className="font-medium text-foreground">{entry.question}</p>
                  </div>
                  <div className="p-4">
                    <h4 className="font-semibold text-foreground mb-2">Answer</h4>
                    <p className="text-foreground text-sm leading-relaxed mb-4">
                      {entry.answer}
                    </p>

                    <div className="pt-3 border-t border-border/30">
                      <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                        <FileStack className="w-3.5 h-3.5" />
                        Based on these notes:
                      </p>
                      <ul className="space-y-1">
                        {entry.sources.map((source, i) => (
                          <li key={i} className="text-sm text-primary/80 hover:text-primary cursor-pointer">
                            • {source}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Ask a question</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Type a question above to search through your study materials and get AI-powered answers.
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AskNotesPage;
