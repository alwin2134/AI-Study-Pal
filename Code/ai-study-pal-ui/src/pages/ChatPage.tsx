import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatHistory } from "@/components/chat/ChatHistory";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles, Brain, FileText, BookOpen, History, Plus } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: { title: string; excerpt: string }[];
}

interface NoteBucket {
  id: string;
  name: string;
}

const quickActions = [
  { icon: Brain, label: "Generate a quiz", prompt: "Generate a quiz on " },
  { icon: FileText, label: "Summarize notes", prompt: "Summarize my notes about " },
  { icon: BookOpen, label: "Explain concept", prompt: "Explain the concept of " },
];

const ChatPage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [buckets, setBuckets] = useState<NoteBucket[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const bucketIdFromUrl = searchParams.get("bucket");

  useEffect(() => {
    if (user) {
      fetchBuckets();
    }

    // Refresh buckets on window focus to catch updates from other tabs/pages
    const onFocus = () => {
      if (user) fetchBuckets();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const fetchBuckets = async () => {
    const { data, error } = await supabase
      .from("note_buckets")
      .select("id, name")
      .order("name");

    if (!error && data) {
      setBuckets(data);
    }
  };

  const createOrUpdateSession = async (firstMessage: string, bucketId?: string) => {
    if (!user) return null;

    if (currentSessionId) {
      // Update existing session
      await supabase
        .from("chat_sessions")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", currentSessionId);
      return currentSessionId;
    }

    // Create new session
    const title = firstMessage.slice(0, 50) + (firstMessage.length > 50 ? "..." : "");
    const { data, error } = await supabase
      .from("chat_sessions")
      .insert({
        user_id: user.id,
        bucket_id: bucketId || buckets[0]?.id,
        title,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create session:", error);
      return null;
    }

    setCurrentSessionId(data.id);
    return data.id;
  };

  const saveMessage = async (sessionId: string, role: string, content: string) => {
    if (!user || !sessionId) return;

    await supabase.from("chat_messages").insert({
      session_id: sessionId,
      user_id: user.id,
      role,
      content,
    });
  };

  const loadSession = async (sessionId: string, bucketId: string) => {
    setCurrentSessionId(sessionId);
    setSearchParams({ bucket: bucketId, session: sessionId });
    setShowHistory(false);

    // Load messages for this session
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (error) {
      toast.error("Failed to load chat");
      return;
    }

    setMessages(
      (data || []).map((msg) => ({
        id: msg.id,
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }))
    );
  };

  const startNewChat = () => {
    setMessages([]);
    setCurrentSessionId(null);
    setStreamingContent("");
    setSearchParams({});
  };

  // Updated signature to accept provider
  const handleSend = async (message: string, useNotes: boolean, bucketId?: string, provider: string = "local") => {
    if (!message.trim() || isLoading) return;

    // Add user message immediately
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: message,
    };

    setMessages((prev) => [...prev, userMessage]);
    setStreamingContent("");
    setIsLoading(true);

    try {
      // Create/update session and save user message
      const sessionId = await createOrUpdateSession(message, bucketId || bucketIdFromUrl || undefined);
      if (sessionId) {
        saveMessage(sessionId, "user", message).catch(e => console.error("Failed to save user msg", e));
      }

      // Get Keys
      const storedKeys = localStorage.getItem("ai_api_keys");
      const apiKeys = storedKeys ? JSON.parse(storedKeys) : {};
      const key = provider === "gemini" ? apiKeys.gemini : (provider === "openai" ? apiKeys.openai : undefined);

      // Use streaming is NOT supported by Flask simple backend yet, so standard fetch
      const activeBucketId = bucketId || bucketIdFromUrl;
      const activeBucket = buckets.find(b => b.id === activeBucketId);

      // FAIL-SAFE: If a specific bucket ID is requested but not found (stale state), 
      // send a dummy name to prevent "All Notes" leakage. 
      // Only default to "All Notes" if ID is null/undefined or explicitly 'all'.
      let safeBucketName = "All Notes";
      if (activeBucketId && activeBucketId !== 'all') {
        safeBucketName = activeBucket ? activeBucket.name : "Unresolved Bucket";
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          useNotes,
          bucketId: activeBucketId,
          bucketName: safeBucketName, // Send safe name
          history: messages.slice(-10).map((m) => ({
            role: m.role,
            content: m.content,
          })),
          provider,
          provider_options: { api_key: key }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      // Finalize message
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.content || "I couldn't generate a response.",
        sources: data.sources,
      };

      setMessages((prev) => [...prev, aiMessage]);
      setStreamingContent("");

      // Save AI message (non-blocking)
      if (sessionId) {
        saveMessage(sessionId, "assistant", aiMessage.content).catch(e => console.error("Failed to save AI msg", e));
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast.error("Failed to get response. Please try again.");

      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "I'm having trouble connecting right now. Please make sure your notes have been processed and try again.",
      };
      setMessages((prev) => [...prev, fallbackMessage]);
      setStreamingContent("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      {/* History Sidebar */}
      <ChatHistory
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        onSelectSession={loadSession}
        currentSessionId={currentSessionId || undefined}
      />

      <div className="flex flex-col h-screen">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-border/50">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHistory(true)}
              className="p-2 rounded-lg hover:bg-secondary/50 transition-colors"
              title="Chat history"
            >
              <History className="w-5 h-5 text-muted-foreground" />
            </button>
            <button
              onClick={startNewChat}
              className="p-2 rounded-lg hover:bg-secondary/50 transition-colors"
              title="New chat"
            >
              <Plus className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
          <div className="text-sm text-muted-foreground">
            {currentSessionId ? "Chat Session" : "New Chat"}
          </div>
          <div className="w-20" /> {/* Spacer */}
        </div>

        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {messages.length === 0 && !streamingContent ? (
            <div className="flex flex-col items-center justify-center h-full animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-6 animate-pulse-glow">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                How can I help you study?
              </h1>
              <p className="text-muted-foreground text-center max-w-md mb-8">
                Ask questions about your notes, generate quizzes, or get explanations on
                any topic.
              </p>

              <div className="flex flex-wrap gap-3 justify-center">
                {quickActions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => { }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary/50 hover:bg-secondary border border-border/50 text-sm text-foreground transition-all hover:-translate-y-0.5"
                  >
                    <action.icon className="w-4 h-4 text-primary" />
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  role={message.role}
                  content={message.content}
                  sources={message.sources}
                />
              ))}
              {streamingContent && (
                <ChatMessage role="assistant" content={streamingContent} isStreaming />
              )}
              {isLoading && !streamingContent && (
                <ChatMessage role="assistant" content="" isLoading />
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-6 pt-0">
          <div className="max-w-3xl mx-auto">
            <ChatInput
              onSend={handleSend}
              isLoading={isLoading}
              buckets={buckets}
              defaultBucketId={bucketIdFromUrl || undefined}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ChatPage;
