import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useStudentProfile } from "@/contexts/StudentProfileContext";
import { 
  Menu, X, BookOpen, Calendar, Brain, FileText, 
  Lightbulb, Trophy, FolderOpen, MessageSquare, LogOut, Home, Files, History, User 
} from "lucide-react";

const navLinks = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Study Plan", href: "/study-plan", icon: Calendar },
  { label: "Quizzes", href: "/quiz", icon: Brain },
  { label: "Quiz History", href: "/quiz-history", icon: History },
  { label: "Notes", href: "/notes", icon: Files },
  { label: "Ask Notes", href: "/ask-notes", icon: MessageSquare },
  { label: "Summarizer", href: "/summarizer", icon: FileText },
  { label: "Tips", href: "/tips", icon: Lightbulb },
  { label: "Feedback", href: "/feedback", icon: Trophy },
  { label: "Resources", href: "/resources", icon: FolderOpen },
];

export const DashboardNav = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { signOut, user } = useAuth();
  const { profile } = useStudentProfile();
  const location = useLocation();

  return (
    <nav className="glass-navbar fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg text-foreground">AI Study Pal</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-6">
            {navLinks.slice(0, 5).map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`nav-link flex items-center gap-1.5 ${
                  location.pathname === link.href ? "text-primary" : ""
                }`}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
            <div className="relative group">
              <button className="nav-link">More ▾</button>
              <div className="absolute right-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <div className="glass-card p-2 min-w-[160px]">
                  {navLinks.slice(5).map((link) => (
                    <Link
                      key={link.href}
                      to={link.href}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    >
                      <link.icon className="w-4 h-4" />
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-4">
            <Link 
              to="/profile" 
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <User className="w-4 h-4" />
              {profile ? `${profile.syllabus} Grade ${profile.grade}` : "Set Profile"}
            </Link>
            <button
              onClick={signOut}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 text-foreground hover:text-primary transition-colors"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile nav */}
        {isOpen && (
          <div className="lg:hidden pt-4 pb-2 animate-fade-in">
            <div className="flex flex-col gap-1">
              <Link
                to="/profile"
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-2 py-2 px-3 rounded-lg text-sm ${
                  location.pathname === "/profile"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary/50"
                }`}
              >
                <User className="w-4 h-4" />
                Profile {profile && `(${profile.syllabus} Grade ${profile.grade})`}
              </Link>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-2 py-2 px-3 rounded-lg text-sm ${
                    location.pathname === link.href
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary/50"
                  }`}
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Link>
              ))}
              <div className="border-t border-border/50 mt-2 pt-2">
                <button
                  onClick={() => {
                    signOut();
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-2 py-2 px-3 w-full text-left text-sm text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
