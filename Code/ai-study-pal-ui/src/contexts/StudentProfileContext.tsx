import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

interface StudentProfile {
  id: string;
  name: string | null;
  syllabus: string;
  grade: string;
  subjects: string[];
}

interface StudentProfileContextType {
  profile: StudentProfile | null;
  isLoading: boolean;
  updateProfile: (data: Partial<StudentProfile>) => Promise<void>;
  createProfile: (data: Omit<StudentProfile, 'id'>) => Promise<void>;
}

const StudentProfileContext = createContext<StudentProfileContextType | undefined>(undefined);

const syllabusData: Record<string, { grades: string[]; subjects: Record<string, string[]> }> = {
  CBSE: {
    grades: ["9", "10", "11", "12"],
    subjects: {
      "9": ["Mathematics", "Science", "Social Science", "English", "Hindi"],
      "10": ["Mathematics", "Science", "Social Science", "English", "Hindi"],
      "11": ["Mathematics", "Physics", "Chemistry", "Biology", "Computer Science", "English", "Economics", "Business Studies", "Accountancy"],
      "12": ["Mathematics", "Physics", "Chemistry", "Biology", "Computer Science", "English", "Economics", "Business Studies", "Accountancy"],
    }
  },
  ICSE: {
    grades: ["9", "10", "11", "12"],
    subjects: {
      "9": ["Mathematics", "Physics", "Chemistry", "Biology", "English", "History", "Geography"],
      "10": ["Mathematics", "Physics", "Chemistry", "Biology", "English", "History", "Geography"],
      "11": ["Mathematics", "Physics", "Chemistry", "Biology", "Computer Science", "English", "Economics", "Commerce"],
      "12": ["Mathematics", "Physics", "Chemistry", "Biology", "Computer Science", "English", "Economics", "Commerce"],
    }
  },
  "State Board": {
    grades: ["9", "10", "11", "12"],
    subjects: {
      "9": ["Mathematics", "Science", "Social Studies", "English", "Regional Language"],
      "10": ["Mathematics", "Science", "Social Studies", "English", "Regional Language"],
      "11": ["Mathematics", "Physics", "Chemistry", "Biology", "Computer Science", "English"],
      "12": ["Mathematics", "Physics", "Chemistry", "Biology", "Computer Science", "English"],
    }
  },
  IB: {
    grades: ["9", "10", "11", "12"],
    subjects: {
      "9": ["Mathematics", "Sciences", "Language & Literature", "Individuals & Societies"],
      "10": ["Mathematics", "Sciences", "Language & Literature", "Individuals & Societies"],
      "11": ["Mathematics", "Physics", "Chemistry", "Biology", "Economics", "English", "Theory of Knowledge"],
      "12": ["Mathematics", "Physics", "Chemistry", "Biology", "Economics", "English", "Theory of Knowledge"],
    }
  },
};

export const getSyllabusData = () => syllabusData;
export const getGradesForSyllabus = (syllabus: string) => syllabusData[syllabus]?.grades || [];
export const getSubjectsForGrade = (syllabus: string, grade: string) => syllabusData[syllabus]?.subjects[grade] || [];

export const StudentProfileProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
      setIsLoading(false);
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    setIsLoading(true);
    const { data, error } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (error) {
      console.error("Error fetching profile:", error);
    } else if (data) {
      setProfile({
        id: data.id,
        name: data.name,
        syllabus: data.syllabus,
        grade: data.grade,
        subjects: data.subjects || [],
      });
    }
    setIsLoading(false);
  };

  const createProfile = async (data: Omit<StudentProfile, 'id'>) => {
    if (!user) return;
    
    const { data: newProfile, error } = await supabase
      .from('student_profiles')
      .insert([{
        user_id: user.id,
        name: data.name,
        syllabus: data.syllabus,
        grade: data.grade,
        subjects: data.subjects,
      }])
      .select()
      .single();
    
    if (error) {
      console.error("Error creating profile:", error);
      throw error;
    }
    
    setProfile({
      id: newProfile.id,
      name: newProfile.name,
      syllabus: newProfile.syllabus,
      grade: newProfile.grade,
      subjects: newProfile.subjects || [],
    });
  };

  const updateProfile = async (data: Partial<StudentProfile>) => {
    if (!user || !profile) return;
    
    const { error } = await supabase
      .from('student_profiles')
      .update({
        name: data.name,
        syllabus: data.syllabus,
        grade: data.grade,
        subjects: data.subjects,
      })
      .eq('user_id', user.id);
    
    if (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
    
    setProfile({ ...profile, ...data });
  };

  return (
    <StudentProfileContext.Provider value={{ profile, isLoading, updateProfile, createProfile }}>
      {children}
    </StudentProfileContext.Provider>
  );
};

export const useStudentProfile = () => {
  const context = useContext(StudentProfileContext);
  if (context === undefined) {
    throw new Error("useStudentProfile must be used within a StudentProfileProvider");
  }
  return context;
};
