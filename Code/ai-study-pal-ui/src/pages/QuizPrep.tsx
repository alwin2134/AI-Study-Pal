import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useQuiz } from "@/contexts/QuizContext";
import { useStudentProfile, getSubjectsForGrade } from "@/contexts/StudentProfileContext";
import { Brain, Zap, Clock, Target, ArrowRight, Loader2, GraduationCap } from "lucide-react";

const difficulties = [
  { id: "easy", name: "Easy", description: "Basic concepts", color: "bg-green-500/10 text-green-600 border-green-200" },
  { id: "medium", name: "Medium", description: "Intermediate level", color: "bg-amber-500/10 text-amber-600 border-amber-200" },
  { id: "hard", name: "Hard", description: "Advanced topics", color: "bg-red-500/10 text-red-600 border-red-200" },
];

const questionCounts = [5, 10, 15, 20];

const QuizPrep = () => {
  const { profile } = useStudentProfile();
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [numQuestions, setNumQuestions] = useState(10);

  // Custom Quiz State
  const [source, setSource] = useState<'subjects' | 'notes'>('subjects');
  const [buckets, setBuckets] = useState<Record<string, any[]>>({});
  const [selectedBucket, setSelectedBucket] = useState("");
  const [filesInBucket, setFilesInBucket] = useState<any[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  const { startQuiz, isGenerating } = useQuiz();
  const navigate = useNavigate();

  const subjects = profile ? getSubjectsForGrade(profile.syllabus, profile.grade) : [];

  // Load files for Custom Quiz
  useEffect(() => {
    fetch('/api/files')
      .then(res => res.json())
      .then(data => {
        // Group by bucket
        const grouped: Record<string, any[]> = {};
        Object.entries(data).forEach(([fname, info]: [string, any]) => {
          const b = info.bucket_name || 'Uncategorized';
          if (!grouped[b]) grouped[b] = [];
          grouped[b].push({ name: fname, ...info });
        });
        setBuckets(grouped);
      })
      .catch(err => console.error("Failed to load files", err));
  }, []);

  // Update file list when bucket changes
  useEffect(() => {
    if (selectedBucket) {
      setFilesInBucket(buckets[selectedBucket] || []);
      setSelectedFiles([]); // Reset selection
    }
  }, [selectedBucket, buckets]);

  const handleFileToggle = (fname: string) => {
    setSelectedFiles(prev =>
      prev.includes(fname) ? prev.filter(f => f !== fname) : [...prev, fname]
    );
  };

  const handleStartQuiz = async () => {
    if (!difficulty) return;

    // Validation
    if (source === 'subjects' && !topic) return;
    if (source === 'notes' && selectedFiles.length === 0) return;

    try {
      const settings = {
        topic: source === 'subjects' ? (topics.find(t => t.id === topic)?.name || topic) : 'My Notes',
        difficulty,
        numQuestions,
        syllabus: profile?.syllabus,
        grade: profile?.grade,
        // Send filenames if custom source
        filenames: source === 'notes' ? selectedFiles : undefined
      };

      await startQuiz(settings);
      navigate("/quiz/active");
    } catch (error) {
      // Error handled in context
    }
  };

  const isReady = difficulty && !isGenerating && (
    (source === 'subjects' && topic) ||
    (source === 'notes' && selectedFiles.length > 0)
  );

  // Helper for icons
  function getSubjectIcon(subject: string): string {
    const icons: Record<string, string> = {
      "Mathematics": "📐", "Physics": "⚛️", "Chemistry": "🧪", "Biology": "🧬",
      "Computer Science": "💻", "English": "📖", "History": "📜", "Geography": "🌍",
      "Economics": "📊", "Business Studies": "💼"
    };
    return icons[subject] || "📚";
  }

  const topics = subjects.map(s => ({
    id: s.toLowerCase().replace(/\s+/g, '-'),
    name: s,
    icon: getSubjectIcon(s)
  }));

  if (!profile) {
    return (
      <DashboardLayout>
        <div className="animate-fade-in max-w-2xl mx-auto text-center py-20">
          {/* Profile Check UI remains same - reusing existing styled component would be better but simple here */}
          <h1 className="text-2xl font-bold mb-4">Please Complete Profile</h1>
          <button onClick={() => navigate("/profile")} className="btn-primary">Go to Profile</button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="animate-fade-in max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-primary" />
          </div>
          <h1 className="section-title mb-2">Quiz Setup</h1>
          <p className="section-subtitle">AI-powered quiz for {profile.syllabus} Grade {profile.grade}</p>
        </div>

        {/* Source Toggle */}
        <div className="flex p-1 bg-secondary rounded-xl mb-8">
          <button
            onClick={() => setSource('subjects')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${source === 'subjects' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            📚 Subject Topics
          </button>
          <button
            onClick={() => setSource('notes')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${source === 'notes' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            📝 From My Notes
          </button>
        </div>

        {source === 'subjects' ? (
          /* Topic Selection */
          <div className="glass-card p-6 mb-6">
            <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" /> Select Subject
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {topics.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTopic(t.id)}
                  disabled={isGenerating}
                  className={`p-4 rounded-xl border-2 transition-all text-left disabled:opacity-50 ${topic === t.id
                    ? "border-primary bg-primary/5"
                    : "border-transparent bg-secondary/30 hover:bg-secondary/50"
                    }`}
                >
                  <span className="text-2xl mb-2 block">{t.icon}</span>
                  <span className="font-medium text-foreground text-sm">{t.name}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Notes Selection */
          <div className="glass-card p-6 mb-6">
            <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" /> Select Notes
            </h2>

            {/* Bucket Dropdown */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-muted-foreground mb-1">Folder</label>
              <select
                className="w-full p-3 rounded-xl bg-secondary/30 border-transparent focus:border-primary outline-none"
                value={selectedBucket}
                onChange={(e) => setSelectedBucket(e.target.value)}
              >
                <option value="">-- Select Folder --</option>
                {Object.keys(buckets).map(b => (
                  <option key={b} value={b}>{b} ({buckets[b].length} files)</option>
                ))}
              </select>
            </div>

            {/* File List */}
            {selectedBucket && (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {filesInBucket.map(file => (
                  <label key={file.name} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/20 hover:bg-secondary/40 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                      checked={selectedFiles.includes(file.name)}
                      onChange={() => handleFileToggle(file.name)}
                    />
                    <span className="text-sm text-foreground truncate">{file.original_name || file.name}</span>
                  </label>
                ))}
              </div>
            )}

            {selectedBucket && filesInBucket.length === 0 && (
              <p className="text-sm text-muted-foreground">No files in this folder.</p>
            )}
          </div>
        )}

        {/* Difficulty Selection (Shared) */}
        <div className="glass-card p-6 mb-6">
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            Difficulty Level
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {difficulties.map((d) => (
              <button
                key={d.id}
                onClick={() => setDifficulty(d.id)}
                disabled={isGenerating}
                className={`p-4 rounded-xl border-2 transition-all disabled:opacity-50 ${difficulty === d.id
                  ? `border-primary ${d.color}`
                  : "border-transparent bg-secondary/30 hover:bg-secondary/50"
                  }`}
              >
                <span className="font-semibold text-foreground block mb-1">{d.name}</span>
                <span className="text-xs text-muted-foreground">{d.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Question Count (Shared) */}
        <div className="glass-card p-6 mb-8">
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            Number of Questions
          </h2>
          <div className="flex gap-3">
            {questionCounts.map((count) => (
              <button
                key={count}
                onClick={() => setNumQuestions(count)}
                disabled={isGenerating}
                className={`flex-1 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 ${numQuestions === count
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary/30 text-foreground hover:bg-secondary/50"
                  }`}
              >
                {count}
              </button>
            ))}
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={handleStartQuiz}
          disabled={!isReady}
          className="btn-primary w-full py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating Quiz...
            </>
          ) : (
            <>
              Start Quiz
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </DashboardLayout>
  );
};

export default QuizPrep;
