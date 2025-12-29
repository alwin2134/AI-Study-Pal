import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Lightbulb, Brain, Timer, Mic, Map, Moon, Wand2 } from "lucide-react";
import { toast } from "sonner";

const staticTips = [
  {
    icon: Brain,
    title: "Active Recall",
    description: "Test yourself frequently instead of passive re-reading. This strengthens memory retention significantly.",
    color: "bg-purple-500/10 text-purple-600",
  },
  {
    icon: Timer,
    title: "Spaced Repetition",
    description: "Review material at increasing intervals. Apps like Anki can help automate this process.",
    color: "bg-blue-500/10 text-blue-600",
  },
  // Keep some static tips as defaults
];

const TipsPage = () => {
  const [text, setText] = useState("");
  const [generatedTips, setGeneratedTips] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateTips = async () => {
    // If empty input, show specific message immediately (no API call needed)
    if (!text.trim()) {
      setGeneratedTips(["User has not given any input for personalized tips."]);
      return;
    }

    setIsLoading(true);
    setGeneratedTips([]);
    try {
      const response = await fetch('/api/tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      const data = await response.json();
      setGeneratedTips(data.tips || []);
    } catch (error) {
      console.error("Failed to generate tips", error);
      toast.error("Could not generate tips");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="animate-fade-in max-w-5xl mx-auto space-y-8 p-6 md:p-8">
        <div className="mb-8">
          <h1 className="section-title mb-2">Study Tips</h1>
          <p className="section-subtitle">Evidence-based strategies to boost your learning</p>
        </div>

        {/* Input Section */}
        <div className="glass-card p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-indigo-500" />
            Generate Personalized Tips
          </h2>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your study material here to get specific tips..."
            className="input-field min-h-[100px] mb-4"
          />
          <button
            onClick={handleGenerateTips}
            disabled={isLoading}
            className="btn-primary w-full sm:w-auto"
          >
            {isLoading ? "Generating..." : "Get Tips"}
          </button>
        </div>

        {/* Generated Tips Section */}
        {generatedTips.length > 0 && (
          <div className="mb-8">
            <h3 className="section-title text-xl mb-4">Personalized Tips</h3>
            <div className="grid gap-4">
              {generatedTips.map((tip, index) => (
                <div key={index} className="glass-card p-4 border-l-4 border-indigo-500">
                  <p className="text-foreground">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Static Tips Section */}
        <h3 className="section-title text-xl mb-4">General Strategies</h3>
        <div className="grid gap-4">
          {staticTips.map((tip, index) => (
            <div
              key={index}
              className="glass-card p-6 hover:shadow-glass-hover transition-all duration-300"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex gap-4">
                <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${tip.color} flex items-center justify-center`}>
                  <tip.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">{tip.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{tip.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TipsPage;
