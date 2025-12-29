import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  MessageSquare,
  FolderOpen,
  Brain,
  BarChart3,
  FileText,
  BookOpen,
  Lightbulb,
  Settings,
  LogOut,
  Plus,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

const mainItems: SidebarItem[] = [
  { icon: MessageSquare, label: "Chat", path: "/chat" },
  { icon: FolderOpen, label: "Notes", path: "/notes" },
  { icon: Brain, label: "Quiz", path: "/quiz" },
  { icon: BarChart3, label: "Analytics", path: "/analytics" },
];

const toolItems: SidebarItem[] = [
  { icon: FileText, label: "Summarizer", path: "/summarizer" },
  { icon: BookOpen, label: "Study Plan", path: "/study-plan" },
  { icon: Lightbulb, label: "Tips", path: "/tips" },
];

export const AppSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <aside
      className={cn(
        "glass-sidebar h-screen flex flex-col transition-all duration-300 sticky top-0",
        isCollapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-sidebar-border">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <span className="font-semibold text-foreground">StudyPal</span>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <button
          onClick={() => navigate("/chat")}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl",
            "bg-primary/10 hover:bg-primary/20 text-primary",
            "border border-primary/20 transition-all duration-200",
            isCollapsed && "justify-center"
          )}
        >
          <Plus className="w-4 h-4" />
          {!isCollapsed && <span className="font-medium text-sm">New Chat</span>}
        </button>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <div className="mb-6">
          {!isCollapsed && (
            <p className="px-3 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Main
            </p>
          )}
          <nav className="space-y-1">
            {mainItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className={cn(
                  "sidebar-item w-full",
                  isActive(item.path) && "sidebar-item-active",
                  isCollapsed && "justify-center px-2"
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span>{item.label}</span>}
              </button>
            ))}
          </nav>
        </div>

        <div className="mb-6">
          {!isCollapsed && (
            <p className="px-3 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Tools
            </p>
          )}
          <nav className="space-y-1">
            {toolItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className={cn(
                  "sidebar-item w-full",
                  isActive(item.path) && "sidebar-item-active",
                  isCollapsed && "justify-center px-2"
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span>{item.label}</span>}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border space-y-1">
        <button
          onClick={() => navigate("/profile")}
          className={cn(
            "sidebar-item w-full",
            isActive("/profile") && "sidebar-item-active",
            isCollapsed && "justify-center px-2"
          )}
          title={isCollapsed ? "Profile" : undefined}
        >
          <User className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span>Profile</span>}
        </button>
        <button
          onClick={handleSignOut}
          className={cn(
            "sidebar-item w-full text-destructive hover:text-destructive hover:bg-destructive/10",
            isCollapsed && "justify-center px-2"
          )}
          title={isCollapsed ? "Sign Out" : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};
