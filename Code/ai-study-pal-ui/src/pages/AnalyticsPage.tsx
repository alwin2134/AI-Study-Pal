import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart3,
  TrendingUp,
  Target,
  Clock,
  Award,
  Flame,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

interface QuizAttempt {
  id: string;
  topic: string;
  correct_answers: number;
  total_questions: number;
  completed_at: string;
  difficulty: string;
}

const AnalyticsPage = () => {
  const { user } = useAuth();
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pythonChart, setPythonChart] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchAnalytics();
      fetchPythonStats();
    }
  }, [user]);

  const fetchPythonStats = async () => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      if (data.chart_image) {
        setPythonChart(data.chart_image);
      }
    } catch (e) {
      console.error("Failed to load python stats", e);
    }
  };

  const fetchAnalytics = async () => {
    const { data, error } = await supabase
      .from("quiz_attempts")
      .select("*")
      .order("completed_at", { ascending: false })
      .limit(50);

    if (!error && data) {
      setAttempts(data);
    }
    setIsLoading(false);
  };

  // Calculate stats
  const totalQuizzes = attempts.length;
  const totalQuestions = attempts.reduce((sum, a) => sum + a.total_questions, 0);
  const totalCorrect = attempts.reduce((sum, a) => sum + a.correct_answers, 0);
  const averageScore = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  // Calculate streak (consecutive days)
  const calculateStreak = () => {
    if (attempts.length === 0) return 0;
    const dates = [...new Set(attempts.map(a =>
      new Date(a.completed_at).toDateString()
    ))].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    let streak = 1;
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    if (dates[0] !== today && dates[0] !== yesterday) return 0;

    for (let i = 0; i < dates.length - 1; i++) {
      const curr = new Date(dates[i]).getTime();
      const next = new Date(dates[i + 1]).getTime();
      if (curr - next === 86400000) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  // Prepare chart data
  const chartData = attempts
    .slice(0, 10)
    .reverse()
    .map((a, idx) => ({
      name: `Quiz ${idx + 1}`,
      score: Math.round((a.correct_answers / a.total_questions) * 100),
      topic: a.topic,
    }));

  // Subject breakdown
  const subjectData = attempts.reduce((acc, a) => {
    const key = a.topic;
    if (!acc[key]) {
      acc[key] = { total: 0, correct: 0 };
    }
    acc[key].total += a.total_questions;
    acc[key].correct += a.correct_answers;
    return acc;
  }, {} as Record<string, { total: number; correct: number }>);

  const subjectChartData = Object.entries(subjectData)
    .map(([subject, data]) => ({
      subject: subject.length > 10 ? subject.slice(0, 10) + "..." : subject,
      score: Math.round((data.correct / data.total) * 100),
    }))
    .slice(0, 6);

  const statCards = [
    {
      icon: Target,
      label: "Total Quizzes",
      value: totalQuizzes,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      icon: TrendingUp,
      label: "Average Score",
      value: `${averageScore}%`,
      color: "text-green-400",
      bg: "bg-green-400/10",
    },
    {
      icon: Flame,
      label: "Current Streak",
      value: `${calculateStreak()} days`,
      color: "text-orange-400",
      bg: "bg-orange-400/10",
    },
    {
      icon: Award,
      label: "Questions Answered",
      value: totalQuestions,
      color: "text-purple-400",
      bg: "bg-purple-400/10",
    },
  ];

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto animate-fade-in">
        <div className="mb-8">
          <h1 className="section-title mb-2 flex items-center gap-3">
            <BarChart3 className="w-7 h-7 text-primary" />
            Analytics
          </h1>
          <p className="section-subtitle">Track your learning progress</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat, idx) => (
            <div key={idx} className="glass-card p-5">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Performance Over Time */}
          <div className="glass-card p-6">
            <h2 className="font-semibold text-foreground mb-4">Performance Trend</h2>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(225 15% 20%)" />
                  <XAxis dataKey="name" stroke="hsl(220 10% 55%)" fontSize={12} />
                  <YAxis stroke="hsl(220 10% 55%)" fontSize={12} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(225 15% 12%)",
                      border: "1px solid hsl(225 15% 20%)",
                      borderRadius: "12px",
                      color: "hsl(210 20% 95%)",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="hsl(175 70% 50%)"
                    strokeWidth={2}
                    dot={{ fill: "hsl(175 70% 50%)", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No quiz data yet. Take a quiz to see your progress!
              </div>
            )}
          </div>

          {/* Subject Breakdown */}
          <div className="glass-card p-6">
            <h2 className="font-semibold text-foreground mb-4">Subject Performance</h2>
            {subjectChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={subjectChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(225 15% 20%)" />
                  <XAxis dataKey="subject" stroke="hsl(220 10% 55%)" fontSize={11} />
                  <YAxis stroke="hsl(220 10% 55%)" fontSize={12} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(225 15% 12%)",
                      border: "1px solid hsl(225 15% 20%)",
                      borderRadius: "12px",
                      color: "hsl(210 20% 95%)",
                    }}
                  />
                  <Bar dataKey="score" fill="hsl(175 70% 50%)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Take quizzes on different subjects to see breakdown!
              </div>
            )}
          </div>
        </div>

        {/* Python Data Insights */}
        {pythonChart && (
          <div className="glass-card p-6 mt-6 animate-fade-in">
            <h2 className="font-semibold text-foreground mb-4">Dataset Insights (Python/Matplotlib)</h2>
            <div className="flex justify-center">
              <img src={pythonChart} alt="Subject Distribution" className="max-w-full h-auto rounded-xl border border-border/50" />
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="glass-card p-6 mt-6">
          <h2 className="font-semibold text-foreground mb-4">Recent Activity</h2>
          {attempts.length > 0 ? (
            <div className="space-y-3">
              {attempts.slice(0, 5).map((attempt) => (
                <div
                  key={attempt.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-secondary/30"
                >
                  <div>
                    <p className="font-medium text-foreground">{attempt.topic}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(attempt.completed_at).toLocaleDateString()} • {attempt.difficulty}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary">
                      {Math.round((attempt.correct_answers / attempt.total_questions) * 100)}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {attempt.correct_answers}/{attempt.total_questions}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No activity yet. Start taking quizzes!
            </p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AnalyticsPage;
