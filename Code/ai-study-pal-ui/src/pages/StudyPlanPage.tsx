import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calendar, Clock, BookOpen, Loader2, Trash2, History } from "lucide-react";
import { useStudentProfile, getSubjectsForGrade } from "@/contexts/StudentProfileContext";

const scenarios = ["Exam preparation", "Daily learning", "Quick review", "Deep understanding", "Skill building"];

interface PlanTask {
  type: string;
  text: string;
  time: string;
}

interface PlanDay {
  day: string;
  tasks: (string | PlanTask)[];
}

interface SavedPlan {
  id: string;
  subject: string;
  hours_per_week: number;
  scenario: string;
  plan: PlanDay[];
  created_at: string;
}

const StudyPlanPage = () => {
  const { user } = useAuth();
  const { profile } = useStudentProfile();
  const [subject, setSubject] = useState("");
  const [hours, setHours] = useState("");
  const [scenario, setScenario] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [plan, setPlan] = useState<PlanDay[] | null>(null);
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const subjects = profile ? getSubjectsForGrade(profile.syllabus, profile.grade) : [];

  useEffect(() => {
    if (user) {
      fetchSavedPlans();
    }
  }, [user]);

  const fetchSavedPlans = async () => {
    const { data, error } = await supabase
      .from('study_plans')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error(error);
    } else {
      setSavedPlans(data?.map(p => ({
        ...p,
        plan: (typeof p.plan === 'string' ? JSON.parse(p.plan) : p.plan) as PlanDay[]
      })) || []);
    }
  };

  const handleGenerate = async () => {
    if (!subject || !hours || !scenario || !user) return;

    setIsLoading(true);
    try {
      // 1. Store user inputs in backend (Python requirement)
      await fetch('/api/input', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, hours, text: scenario })
      });

      // 2. Generate Plan (Existing UI Logic via Supabase - keeping it or could replace with backend logic if needed, but staying minimal for now)
      // Actually, for "Web Deployment" user wants "app outputs study plan". I will keep existing logic for the Plan UI 
      // but ADD the schedule CSV download link below.

      // 2. Generate Plan using Local Python Backend
      // This replaces the Supabase Edge Function to avoid deployment dependency
      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          hoursPerDay: parseInt(hours),
          scenario,
          syllabus: profile?.syllabus,
          grade: profile?.grade
        })
      });

      if (!response.ok) {
        throw new Error("Failed to reach AI service");
      }

      const data = await response.json();

      if (data.error) throw new Error(data.error);
      if (!data.plan) throw new Error("No plan generated");

      setPlan(data.plan);

      const { error: saveError } = await supabase.from('study_plans').insert([{
        user_id: user.id,
        subject,
        hours_per_week: parseInt(hours) * 7,
        scenario,
        plan: JSON.stringify(data.plan)
      }]);

      if (saveError) {
        console.error("Error saving plan:", saveError);
      } else {
        toast.success("Study plan saved!");
        fetchSavedPlans();
      }
    } catch (error) {
      console.error("Error generating plan:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate plan");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadSchedule = async () => {
    try {
      const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, hours })
      });
      const data = await response.json();

      // Create download link
      const blob = new Blob([data.csv_content], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Schedule downloaded!");
    } catch (e) {
      toast.error("Failed to download schedule");
    }
  };


  const loadPlan = (saved: SavedPlan) => {
    setSubject(saved.subject);
    setHours(String(Math.round(saved.hours_per_week / 7)));
    setScenario(saved.scenario);
    setPlan(saved.plan);
    setShowHistory(false);
  };

  const deletePlan = async (id: string) => {
    const { error } = await supabase.from('study_plans').delete().eq('id', id);
    if (error) {
      toast.error("Failed to delete plan");
    } else {
      setSavedPlans(savedPlans.filter(p => p.id !== id));
      toast.success("Plan deleted");
    }
  };

  return (
    <DashboardLayout>
      <div className="animate-fade-in max-w-5xl mx-auto space-y-8 p-6 md:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="section-title mb-2">Plan Your Week</h1>
            <p className="section-subtitle">
              Generate a personalized AI study schedule
              {profile && <span className="text-primary"> • {profile.syllabus} Grade {profile.grade}</span>}
            </p>
          </div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="btn-secondary flex items-center gap-2"
          >
            <History className="w-4 h-4" />
            {showHistory ? "Hide History" : "History"}
          </button>
        </div>

        {showHistory && savedPlans.length > 0 && (
          <div className="glass-card p-6 mb-6 animate-fade-in">
            <h3 className="font-semibold text-foreground mb-4">Saved Plans</h3>
            <div className="space-y-2">
              {savedPlans.map((saved) => (
                <div
                  key={saved.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <button
                    onClick={() => loadPlan(saved)}
                    className="flex-1 text-left"
                  >
                    <p className="font-medium text-foreground">{saved.subject}</p>
                    <p className="text-xs text-muted-foreground">
                      {saved.scenario} • {new Date(saved.created_at).toLocaleDateString()}
                    </p>
                  </button>
                  <button
                    onClick={() => deletePlan(saved.id)}
                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="glass-card p-6 md:p-8">
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <BookOpen className="w-4 h-4 inline mr-2" />
                Subject
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="input-field"
                disabled={isLoading}
              >
                <option value="">Select subject</option>
                {subjects.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Clock className="w-4 h-4 inline mr-2" />
                Hours per day
              </label>
              <input
                type="number"
                min="1"
                max="8"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="e.g., 2"
                className="input-field"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Goal
              </label>
              <select
                value={scenario}
                onChange={(e) => setScenario(e.target.value)}
                className="input-field"
                disabled={isLoading}
              >
                <option value="">Select goal</option>
                {scenarios.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!subject || !hours || !scenario || isLoading}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                Generating...
              </>
            ) : (
              "Generate Plan"
            )}
          </button>

          {plan && (
            <button
              onClick={handleDownloadSchedule}
              className="btn-secondary ml-4"
            >
              Download Schedule (CSV)
            </button>
          )}

          {plan && (
            <div className="mt-8 pt-8 border-t border-border/50 animate-fade-in">
              <h3 className="font-semibold text-foreground mb-4">Your Weekly Plan</h3>
              <div className="grid gap-3">
                {plan.map((day) => (
                  <div key={day.day} className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4 p-4 rounded-xl bg-secondary/30">
                    <span className="font-medium text-foreground min-w-[100px]">{day.day}</span>
                    <div className="flex flex-wrap gap-2">
                      {day.tasks.map((task, i) => (
                        <span key={i} className="px-3 py-1 rounded-full bg-accent/50 text-accent-foreground text-sm text-left">
                          {typeof task === 'string' ? task : `${task.type}: ${task.text} (${task.time})`}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudyPlanPage;
