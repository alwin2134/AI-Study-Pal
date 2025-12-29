import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { QuizProvider } from "@/contexts/QuizContext";
import { StudentProfileProvider } from "@/contexts/StudentProfileContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import ChatPage from "./pages/ChatPage";
import ProfilePage from "./pages/ProfilePage";
import StudyPlanPage from "./pages/StudyPlanPage";
import QuizPrep from "./pages/QuizPrep";
import QuizActive from "./pages/QuizActive";
import QuizHistoryPage from "./pages/QuizHistoryPage";
import SummarizerPage from "./pages/SummarizerPage";
import TipsPage from "./pages/TipsPage";
import NotesPage from "./pages/NotesPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <StudentProfileProvider>
        <QuizProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
                <Route path="/dashboard" element={<Navigate to="/chat" replace />} />
                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="/study-plan" element={<ProtectedRoute><StudyPlanPage /></ProtectedRoute>} />
                <Route path="/quiz" element={<ProtectedRoute><QuizPrep /></ProtectedRoute>} />
                <Route path="/quiz/active" element={<ProtectedRoute><QuizActive /></ProtectedRoute>} />
                <Route path="/quiz-history" element={<ProtectedRoute><QuizHistoryPage /></ProtectedRoute>} />
                <Route path="/summarizer" element={<ProtectedRoute><SummarizerPage /></ProtectedRoute>} />
                <Route path="/tips" element={<ProtectedRoute><TipsPage /></ProtectedRoute>} />
                <Route path="/notes" element={<ProtectedRoute><NotesPage /></ProtectedRoute>} />
                <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </QuizProvider>
      </StudentProfileProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
