import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useStudentProfile, getSyllabusData, getSubjectsForGrade } from "@/contexts/StudentProfileContext";
import { toast } from "sonner";
import { GraduationCap, User, BookOpen, Loader2, Save } from "lucide-react";

const ProfilePage = () => {
  const { user } = useAuth();
  const { profile, isLoading, createProfile, updateProfile } = useStudentProfile();
  const navigate = useNavigate();
  
  const [name, setName] = useState("");
  const [syllabus, setSyllabus] = useState("CBSE");
  const [grade, setGrade] = useState("12");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const syllabusData = getSyllabusData();
  const syllabusOptions = Object.keys(syllabusData);
  const gradeOptions = syllabusData[syllabus]?.grades || [];
  const subjectOptions = getSubjectsForGrade(syllabus, grade);

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setSyllabus(profile.syllabus);
      setGrade(profile.grade);
      setSelectedSubjects(profile.subjects);
    }
  }, [profile]);

  useEffect(() => {
    // Reset subjects when syllabus/grade changes
    if (!profile) {
      setSelectedSubjects([]);
    }
  }, [syllabus, grade]);

  const toggleSubject = (subject: string) => {
    setSelectedSubjects(prev => 
      prev.includes(subject) 
        ? prev.filter(s => s !== subject)
        : [...prev, subject]
    );
  };

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const data = {
        name: name.trim() || null,
        syllabus,
        grade,
        subjects: selectedSubjects
      };

      if (profile) {
        await updateProfile(data);
      } else {
        await createProfile(data);
      }
      
      toast.success("Profile saved!");
      navigate("/dashboard");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="animate-fade-in max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="w-8 h-8 text-primary" />
          </div>
          <h1 className="section-title mb-2">Student Profile</h1>
          <p className="section-subtitle">Personalize your learning experience</p>
        </div>

        {/* Name */}
        <div className="glass-card p-6 mb-6">
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            Your Name
          </h2>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name (optional)"
            className="input-field"
          />
        </div>

        {/* Syllabus & Grade */}
        <div className="glass-card p-6 mb-6">
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            Education Details
          </h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Syllabus / Board
              </label>
              <select
                value={syllabus}
                onChange={(e) => setSyllabus(e.target.value)}
                className="input-field"
              >
                {syllabusOptions.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Grade / Class
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="input-field"
              >
                {gradeOptions.map(g => (
                  <option key={g} value={g}>Grade {g}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Subjects */}
        <div className="glass-card p-6 mb-8">
          <h2 className="font-semibold text-foreground mb-4">
            Select Your Subjects
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Choose the subjects you are studying
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {subjectOptions.map(subject => (
              <button
                key={subject}
                onClick={() => toggleSubject(subject)}
                className={`p-3 rounded-xl border-2 transition-all text-left text-sm ${
                  selectedSubjects.includes(subject)
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-transparent bg-secondary/30 hover:bg-secondary/50 text-muted-foreground"
                }`}
              >
                {subject}
              </button>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save Profile
            </>
          )}
        </button>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
