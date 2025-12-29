import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Trophy, Loader2, Sparkles } from "lucide-react";

const subjects = ["Mathematics", "Physics", "Chemistry", "Biology", "History", "Literature", "Computer Science"];

const FeedbackPage = () => {
  const [score, setScore] = useState(75);
  const [subject, setSubject] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

  const handleGetFeedback = () => {
    if (!subject) return;
    
    setIsLoading(true);
    setTimeout(() => {
      const feedbackMessages: Record<string, string> = {
        high: `Excellent work on your ${subject} test! Your score of ${score}% shows strong mastery. Keep challenging yourself with advanced problems to maintain this momentum. You're on track for success!`,
        medium: `Good effort on your ${subject} test! A ${score}% shows you understand the fundamentals. Focus on the topics where you lost points, and consider reviewing those concepts. You're making solid progress!`,
        low: `Don't be discouraged by your ${subject} score of ${score}%. Every expert was once a beginner. Let's identify the challenging areas and create a focused study plan. Small, consistent steps lead to big improvements!`,
      };
      
      const level = score >= 80 ? "high" : score >= 60 ? "medium" : "low";
      setFeedback(feedbackMessages[level]);
      setIsLoading(false);
    }, 1000);
  };

  const getScoreColor = () => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-amber-600";
    return "text-rose-500";
  };

  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        <div className="mb-8">
          <h1 className="section-title mb-2">Get Feedback</h1>
          <p className="section-subtitle">Receive personalized motivation based on your performance</p>
        </div>

        <div className="glass-card p-6 md:p-8">
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <label className="block text-sm font-medium text-foreground mb-4">
                Your Score
              </label>
              <div className="text-center mb-4">
                <span className={`text-6xl font-bold ${getScoreColor()}`}>{score}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={score}
                onChange={(e) => setScore(parseInt(e.target.value))}
                className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-sm text-muted-foreground mt-2">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-4">
                Subject
              </label>
              <div className="grid grid-cols-2 gap-2">
                {subjects.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSubject(s)}
                    className={`p-3 rounded-xl text-sm font-medium transition-all ${
                      subject === s
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary/30 text-foreground hover:bg-secondary/50"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleGetFeedback}
            disabled={!subject || isLoading}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                Generating...
              </>
            ) : (
              "Get Feedback"
            )}
          </button>

          {feedback && (
            <div className="mt-8 flex justify-center animate-scale-in">
              <div className="glass-card p-8 max-w-lg text-center bg-gradient-to-br from-primary/5 to-accent/10">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <p className="text-foreground text-lg leading-relaxed">{feedback}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FeedbackPage;
