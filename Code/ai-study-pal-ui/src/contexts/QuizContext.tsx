import { createContext, useContext, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Question {
  id: number;
  question: string;
  options: string[];
  correct: number;
}

interface QuizSettings {
  topic: string;
  difficulty: string;
  numQuestions: number;
  syllabus?: string;
  grade?: string;
  filenames?: string[];
}

interface QuizContextType {
  settings: QuizSettings | null;
  questions: Question[];
  answers: Record<number, number>;
  currentIndex: number;
  isSubmitted: boolean;
  isGenerating: boolean;
  startQuiz: (settings: QuizSettings) => Promise<void>;
  setAnswer: (questionId: number, answerIndex: number) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  goToQuestion: (index: number) => void;
  submitQuiz: () => Promise<void>;
  resetQuiz: () => void;
  getScore: () => number;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

export const QuizProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<QuizSettings | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const startQuiz = async (newSettings: QuizSettings) => {
    setIsGenerating(true);
    setSettings(newSettings);

    try {
      // Call Backend API
      const response = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });

      if (!response.ok) throw new Error('Failed to generate quiz');

      const data = await response.json();
      if (!data.questions || data.questions.length === 0) {
        throw new Error('No questions generated. Try a different topic.');
      }

      setQuestions(data.questions);
      setAnswers({});
      setCurrentIndex(0);
      setIsSubmitted(false);
    } catch (error) {
      console.error("Error generating quiz:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate quiz");
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  const setAnswer = (questionId: number, answerIndex: number) => {
    if (!isSubmitted) {
      setAnswers((prev) => ({ ...prev, [questionId]: answerIndex }));
    }
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const goToQuestion = (index: number) => {
    if (index >= 0 && index < questions.length) {
      setCurrentIndex(index);
    }
  };

  const submitQuiz = async () => {
    setIsSubmitted(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !settings) return;

      const score = questions.filter((q) => answers[q.id] === q.correct).length;

      const { error } = await supabase.from('quiz_attempts').insert([{
        user_id: user.id,
        topic: settings.topic,
        difficulty: settings.difficulty,
        total_questions: questions.length,
        correct_answers: score,
        questions: JSON.stringify(questions),
        answers: JSON.stringify(answers)
      }]);

      if (error) {
        console.error("Error saving quiz attempt:", error);
      } else {
        toast.success("Quiz results saved!");
      }
    } catch (error) {
      console.error("Error saving quiz:", error);
    }
  };

  const resetQuiz = () => {
    setSettings(null);
    setQuestions([]);
    setAnswers({});
    setCurrentIndex(0);
    setIsSubmitted(false);
  };

  const getScore = () => {
    return questions.filter((q) => answers[q.id] === q.correct).length;
  };

  return (
    <QuizContext.Provider
      value={{
        settings,
        questions,
        answers,
        currentIndex,
        isSubmitted,
        isGenerating,
        startQuiz,
        setAnswer,
        nextQuestion,
        prevQuestion,
        goToQuestion,
        submitQuiz,
        resetQuiz,
        getScore,
      }}
    >
      {children}
    </QuizContext.Provider>
  );
};

export const useQuiz = () => {
  const context = useContext(QuizContext);
  if (context === undefined) {
    throw new Error("useQuiz must be used within a QuizProvider");
  }
  return context;
};
