import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { 
  Trophy, Calendar, Target, TrendingUp, ChevronRight, 
  CheckCircle2, XCircle, Brain
} from "lucide-react";

interface QuizAttempt {
  id: string;
  topic: string;
  difficulty: string;
  total_questions: number;
  correct_answers: number;
  completed_at: string;
  questions: string;
  answers: string;
}

const QuizHistoryPage = () => {
  const { user } = useAuth();
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [selectedAttempt, setSelectedAttempt] = useState<QuizAttempt | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAttempts();
    }
  }, [user]);

  const fetchAttempts = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('quiz_attempts')
      .select('*')
      .order('completed_at', { ascending: false });
    
    if (error) {
      console.error(error);
    } else {
      setAttempts((data || []).map(d => ({
        ...d,
        questions: typeof d.questions === 'string' ? d.questions : JSON.stringify(d.questions),
        answers: typeof d.answers === 'string' ? d.answers : JSON.stringify(d.answers)
      })));
    }
    setIsLoading(false);
  };

  const getPercentage = (correct: number, total: number) => Math.round((correct / total) * 100);
  
  const getGradeColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600 bg-green-100";
    if (percentage >= 60) return "text-amber-600 bg-amber-100";
    return "text-red-600 bg-red-100";
  };

  const getOverallStats = () => {
    if (attempts.length === 0) return { avgScore: 0, totalQuizzes: 0, totalQuestions: 0 };
    
    const totalCorrect = attempts.reduce((acc, a) => acc + a.correct_answers, 0);
    const totalQuestions = attempts.reduce((acc, a) => acc + a.total_questions, 0);
    
    return {
      avgScore: Math.round((totalCorrect / totalQuestions) * 100),
      totalQuizzes: attempts.length,
      totalQuestions
    };
  };

  const stats = getOverallStats();

  const parseQuestions = (questionsStr: string) => {
    try {
      return typeof questionsStr === 'string' ? JSON.parse(questionsStr) : questionsStr;
    } catch {
      return [];
    }
  };

  const parseAnswers = (answersStr: string) => {
    try {
      return typeof answersStr === 'string' ? JSON.parse(answersStr) : answersStr;
    } catch {
      return {};
    }
  };

  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        <div className="mb-8">
          <h1 className="section-title mb-2">Quiz History</h1>
          <p className="section-subtitle">Track your progress and review past quizzes</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="glass-card p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.avgScore}%</p>
                <p className="text-sm text-muted-foreground">Average Score</p>
              </div>
            </div>
          </div>
          
          <div className="glass-card p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Brain className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.totalQuizzes}</p>
                <p className="text-sm text-muted-foreground">Quizzes Taken</p>
              </div>
            </div>
          </div>
          
          <div className="glass-card p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.totalQuestions}</p>
                <p className="text-sm text-muted-foreground">Questions Answered</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Attempts List */}
          <div className="glass-card p-6">
            <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Recent Quizzes
            </h2>
            
            {isLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : attempts.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">No quizzes taken yet.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {attempts.map((attempt) => {
                  const percentage = getPercentage(attempt.correct_answers, attempt.total_questions);
                  return (
                    <button
                      key={attempt.id}
                      onClick={() => setSelectedAttempt(attempt)}
                      className={`w-full p-4 rounded-xl text-left transition-all ${
                        selectedAttempt?.id === attempt.id
                          ? "bg-primary/10 border-2 border-primary"
                          : "bg-secondary/30 hover:bg-secondary/50 border-2 border-transparent"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{attempt.topic}</p>
                          <p className="text-xs text-muted-foreground">
                            {attempt.difficulty} • {attempt.total_questions} questions • {new Date(attempt.completed_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-lg text-sm font-semibold ${getGradeColor(percentage)}`}>
                            {percentage}%
                          </span>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Attempt Details */}
          <div className="glass-card p-6">
            <h2 className="font-semibold text-foreground mb-4">Quiz Details</h2>
            
            {selectedAttempt ? (
              <div className="animate-fade-in">
                <div className="text-center mb-6">
                  <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${
                    getGradeColor(getPercentage(selectedAttempt.correct_answers, selectedAttempt.total_questions))
                  }`}>
                    <Trophy className="w-10 h-10" />
                  </div>
                  <p className="text-3xl font-bold text-foreground">
                    {selectedAttempt.correct_answers}/{selectedAttempt.total_questions}
                  </p>
                  <p className="text-muted-foreground">
                    {getPercentage(selectedAttempt.correct_answers, selectedAttempt.total_questions)}% correct
                  </p>
                </div>

                <div className="space-y-3 max-h-[350px] overflow-y-auto">
                  {parseQuestions(selectedAttempt.questions).map((q: { id: number; question: string; options: string[]; correct: number }) => {
                    const answers = parseAnswers(selectedAttempt.answers);
                    const userAnswer = answers[q.id];
                    const isCorrect = userAnswer === q.correct;
                    
                    return (
                      <div key={q.id} className={`p-3 rounded-xl text-sm ${
                        isCorrect ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
                      }`}>
                        <div className="flex items-start gap-2">
                          {isCorrect ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                          )}
                          <div>
                            <p className="text-foreground font-medium">{q.question}</p>
                            {!isCorrect && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Your answer: {q.options[userAnswer] || "Not answered"}<br />
                                Correct: {q.options[q.correct]}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center mb-4">
                  <ChevronRight className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-center">
                  Select a quiz from the list to view details
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default QuizHistoryPage;
