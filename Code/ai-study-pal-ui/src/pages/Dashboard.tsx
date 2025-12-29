import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Calendar, Brain, FileText, Lightbulb, 
  Trophy, FolderOpen, MessageSquare, ArrowRight 
} from "lucide-react";

const quickActions = [
  { 
    title: "Create Study Plan", 
    description: "Generate a personalized weekly schedule",
    icon: Calendar, 
    href: "/study-plan",
    color: "bg-blue-500/10 text-blue-600"
  },
  { 
    title: "Take a Quiz", 
    description: "Practice with AI-generated questions",
    icon: Brain, 
    href: "/quiz",
    color: "bg-purple-500/10 text-purple-600"
  },
  { 
    title: "Summarize Notes", 
    description: "Condense lengthy text into key points",
    icon: FileText, 
    href: "/summarizer",
    color: "bg-green-500/10 text-green-600"
  },
  { 
    title: "Study Tips", 
    description: "Evidence-based learning strategies",
    icon: Lightbulb, 
    href: "/tips",
    color: "bg-amber-500/10 text-amber-600"
  },
  { 
    title: "Get Feedback", 
    description: "Receive motivation based on performance",
    icon: Trophy, 
    href: "/feedback",
    color: "bg-rose-500/10 text-rose-600"
  },
  { 
    title: "Ask My Notes", 
    description: "Q&A over your study materials",
    icon: MessageSquare, 
    href: "/ask-notes",
    color: "bg-cyan-500/10 text-cyan-600"
  },
];

const Dashboard = () => {
  const { user } = useAuth();
  const firstName = user?.email?.split("@")[0] || "Student";

  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {firstName}
          </h1>
          <p className="text-muted-foreground">
            What would you like to work on today?
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {quickActions.map((action, index) => (
            <Link
              key={action.href}
              to={action.href}
              className="glass-card p-6 group hover:shadow-glass-hover transition-all duration-300 hover:-translate-y-1"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center flex-shrink-0`}>
                  <action.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {action.description}
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10">
          <Link to="/resources" className="glass-card p-6 flex items-center justify-between group hover:shadow-glass-hover transition-all">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                <FolderOpen className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Browse Resources</h3>
                <p className="text-sm text-muted-foreground">Curated learning tools and websites</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
