import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuiz } from "@/contexts/QuizContext";
import { 
  ChevronLeft, ChevronRight, CheckCircle2, XCircle, 
  Clock, Trophy, RotateCcw, Home, Flag
} from "lucide-react";

const QuizActive = () => {
  const {
    settings,
    questions,
    answers,
    currentIndex,
    isSubmitted,
    setAnswer,
    nextQuestion,
    prevQuestion,
    goToQuestion,
    submitQuiz,
    resetQuiz,
    getScore,
  } = useQuiz();
  const navigate = useNavigate();
  const [timeElapsed, setTimeElapsed] = useState(0);

  useEffect(() => {
    if (!settings || questions.length === 0) {
      navigate("/quiz");
      return;
    }

    if (!isSubmitted) {
      const timer = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [settings, questions, navigate, isSubmitted]);

  if (!settings || questions.length === 0) return null;

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / questions.length) * 100;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSubmit = () => {
    if (answeredCount < questions.length) {
      const unanswered = questions.length - answeredCount;
      if (!confirm(`You have ${unanswered} unanswered question(s). Submit anyway?`)) {
        return;
      }
    }
    submitQuiz();
  };

  const handleRetry = () => {
    resetQuiz();
    navigate("/quiz");
  };

  // Results View
  if (isSubmitted) {
    const score = getScore();
    const percentage = Math.round((score / questions.length) * 100);
    const isPassing = percentage >= 70;

    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg animate-scale-in">
          <div className="glass-card p-8 text-center">
            <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center ${
              isPassing ? "bg-green-100" : "bg-amber-100"
            }`}>
              <Trophy className={`w-10 h-10 ${isPassing ? "text-green-600" : "text-amber-600"}`} />
            </div>

            <h1 className="text-2xl font-bold text-foreground mb-2">
              {isPassing ? "Great job!" : "Keep practicing!"}
            </h1>
            <p className="text-muted-foreground mb-6">
              {isPassing 
                ? "You've demonstrated strong understanding of the material."
                : "Review the questions you missed and try again."}
            </p>

            <div className="text-5xl font-bold text-foreground mb-2">
              {score}/{questions.length}
            </div>
            <p className="text-lg text-muted-foreground mb-8">
              {percentage}% correct • {formatTime(timeElapsed)}
            </p>

            {/* Question Review */}
            <div className="text-left mb-8">
              <h3 className="font-semibold text-foreground mb-3">Review</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {questions.map((q, i) => {
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

            <div className="flex gap-3">
              <button onClick={handleRetry} className="btn-secondary flex-1 flex items-center justify-center gap-2">
                <RotateCcw className="w-4 h-4" />
                Try Again
              </button>
              <Link to="/dashboard" className="btn-primary flex-1 flex items-center justify-center gap-2">
                <Home className="w-4 h-4" />
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Quiz View
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="glass-navbar sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/quiz" className="text-muted-foreground hover:text-foreground">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <span className="font-semibold text-foreground">
                Question {currentIndex + 1} of {questions.length}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span className="font-mono">{formatTime(timeElapsed)}</span>
              </div>
              <button
                onClick={handleSubmit}
                className="btn-primary py-2 px-4 text-sm flex items-center gap-2"
              >
                <Flag className="w-4 h-4" />
                Submit
              </button>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-3 h-1.5 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-2xl">
          <div className="glass-card p-8 animate-fade-in">
            <h2 className="text-xl font-semibold text-foreground mb-8">
              {currentQuestion.question}
            </h2>

            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => {
                const isSelected = answers[currentQuestion.id] === index;
                return (
                  <button
                    key={index}
                    onClick={() => setAnswer(currentQuestion.id, index)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-transparent bg-secondary/30 hover:bg-secondary/50"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground"
                      }`}>
                        {String.fromCharCode(65 + index)}
                      </div>
                      <span className="text-foreground">{option}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={prevQuestion}
              disabled={currentIndex === 0}
              className="btn-secondary py-2 px-4 flex items-center gap-2 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            {/* Question dots */}
            <div className="flex gap-2 overflow-x-auto px-4">
              {questions.map((q, i) => (
                <button
                  key={q.id}
                  onClick={() => goToQuestion(i)}
                  className={`w-8 h-8 rounded-full text-xs font-semibold transition-all flex-shrink-0 ${
                    i === currentIndex
                      ? "bg-primary text-primary-foreground"
                      : answers[q.id] !== undefined
                      ? "bg-green-500 text-white"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <button
              onClick={nextQuestion}
              disabled={currentIndex === questions.length - 1}
              className="btn-secondary py-2 px-4 flex items-center gap-2 disabled:opacity-50"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default QuizActive;
