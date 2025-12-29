import { useState } from "react";
import { Send, BookOpen, Sparkles, Settings, Bot, Cpu, Cloud } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatSettings } from "./ChatSettings";

interface NoteBucket {
  id: string;
  name: string;
}

interface ChatInputProps {
  onSend: (message: string, useNotes: boolean, bucketId?: string, provider?: string) => void;
  isLoading: boolean;
  buckets: NoteBucket[];
  defaultBucketId?: string;
}

export const ChatInput = ({ onSend, isLoading, buckets, defaultBucketId }: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const [useNotes, setUseNotes] = useState(true);
  const [selectedBucket, setSelectedBucket] = useState<string>(defaultBucketId || "all");
  const [provider, setProvider] = useState("local");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiKeys, setApiKeys] = useState<{ openai?: string; gemini?: string }>({});

  // Load keys from localStorage on mount
  useState(() => {
    const saved = localStorage.getItem("ai_api_keys");
    if (saved) setApiKeys(JSON.parse(saved));
  });

  const handleSaveKeys = (keys: { openai?: string; gemini?: string }) => {
    setApiKeys(keys);
    localStorage.setItem("ai_api_keys", JSON.stringify(keys));
  };

  const handleSend = () => {
    if (!message.trim() || isLoading) return;
    // If using notes, force 'local' provider to match the hidden UI state
    // If AI Only, use the selected provider
    const effectiveProvider = useNotes ? 'local' : provider;
    onSend(message, useNotes, selectedBucket !== "all" ? selectedBucket : undefined, effectiveProvider);
    setMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const providers = [
    { id: "local", name: "Local (TinyLlama)", icon: Cpu },
    { id: "gemini", name: "Gemini Pro", icon: Sparkles },
    { id: "openai", name: "GPT-3.5", icon: Cloud },
  ];

  return (
    <div className="chat-input-container">
      <ChatSettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveKeys}
        initialKeys={apiKeys}
      />

      {/* Mode Toggle & Model Select */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <button
          onClick={() => setUseNotes(true)}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
            useNotes
              ? "bg-primary/20 text-primary border border-primary/30"
              : "bg-secondary/50 text-muted-foreground hover:text-foreground"
          )}
        >
          <BookOpen className="w-3.5 h-3.5" />
          Use Notes
        </button>
        <button
          onClick={() => setUseNotes(false)}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
            !useNotes
              ? "bg-primary/20 text-primary border border-primary/30"
              : "bg-secondary/50 text-muted-foreground hover:text-foreground"
          )}
        >
          <Bot className="w-3.5 h-3.5" />
          AI Only
        </button>

        {/* Vertical Divider */}
        {!useNotes && <div className="w-px h-4 bg-border/50 mx-1" />}

        {/* Model Selector - ONLY visible in AI Only mode */}
        {!useNotes && (
          <div className="flex items-center gap-2">
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary/50 text-foreground border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
            >
              {providers.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            {/* Settings Trigger */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary/80 hover:text-primary transition-colors"
              title="API Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        )}


        {useNotes && buckets.length > 0 && (
          <select
            value={selectedBucket}
            onChange={(e) => setSelectedBucket(e.target.value)}
            className="ml-auto px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary/50 text-foreground border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="all">All Buckets</option>
            {buckets.map((bucket) => (
              <option key={bucket.id} value={bucket.id}>
                {bucket.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Input Area */}
      <div className="flex items-end gap-3">
        <div className="flex-1 relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              useNotes
                ? "Ask a question about your notes..."
                : "Chat with your AI study companion..."
            }
            className="w-full px-4 py-3 pr-12 rounded-xl bg-secondary/50 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 resize-none min-h-[48px] max-h-[200px] transition-all"
            rows={1}
            style={{ height: "auto" }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = Math.min(target.scrollHeight, 200) + "px";
            }}
          />
        </div>

        <button
          onClick={handleSend}
          disabled={!message.trim() || isLoading}
          className={cn(
            "p-3 rounded-xl transition-all duration-200",
            message.trim() && !isLoading
              ? "bg-primary text-primary-foreground hover:bg-primary-hover shadow-lg shadow-primary/20"
              : "bg-secondary/50 text-muted-foreground cursor-not-allowed"
          )}
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
