import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { 
  History, MessageSquare, Trash2, X, ChevronRight,
  Loader2 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ChatSession {
  id: string;
  title: string;
  bucket_id: string;
  created_at: string;
  updated_at: string;
  bucket?: {
    name: string;
  };
}

interface ChatHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSession: (sessionId: string, bucketId: string) => void;
  currentSessionId?: string;
}

export const ChatHistory = ({ 
  isOpen, 
  onClose, 
  onSelectSession,
  currentSessionId 
}: ChatHistoryProps) => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && isOpen) {
      fetchSessions();
    }
  }, [user, isOpen]);

  const fetchSessions = async () => {
    if (!user) return;
    
    setIsLoading(true);
    const { data, error } = await supabase
      .from("chat_sessions")
      .select(`
        id,
        title,
        bucket_id,
        created_at,
        updated_at,
        bucket:note_buckets(name)
      `)
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Failed to fetch sessions:", error);
      toast.error("Failed to load chat history");
    } else {
      // Transform the data to handle the bucket relationship
      const transformedData = (data || []).map(session => ({
        ...session,
        bucket: Array.isArray(session.bucket) ? session.bucket[0] : session.bucket
      }));
      setSessions(transformedData);
    }
    setIsLoading(false);
  };

  const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm("Delete this chat session?")) return;

    const { error } = await supabase
      .from("chat_sessions")
      .delete()
      .eq("id", sessionId);

    if (error) {
      toast.error("Failed to delete session");
    } else {
      setSessions(sessions.filter(s => s.id !== sessionId));
      toast.success("Session deleted");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-80 bg-background/95 backdrop-blur-xl border-r border-border/50 shadow-2xl animate-slide-in-left">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">Chat History</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-secondary/50 transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No chat history yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Start a conversation to see it here
              </p>
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => onSelectSession(session.id, session.bucket_id)}
                className={cn(
                  "p-3 rounded-xl cursor-pointer transition-all group",
                  session.id === currentSessionId
                    ? "bg-primary/10 border border-primary/30"
                    : "bg-secondary/30 hover:bg-secondary/50 border border-transparent"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">
                      {session.title || "New Chat"}
                    </p>
                    {session.bucket && (
                      <p className="text-xs text-primary/80 mt-0.5">
                        {session.bucket.name}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(session.updated_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => deleteSession(session.id, e)}
                      className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
