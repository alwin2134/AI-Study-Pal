import { User, Sparkles, Copy, Check, FileText } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Source {
  title: string;
  excerpt: string;
}

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  sources?: (Source | string)[];
  isLoading?: boolean;
  isStreaming?: boolean;
}

export const ChatMessage = ({ role, content, sources, isLoading, isStreaming }: ChatMessageProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex gap-3 animate-fade-in">
        <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <div className="message-ai flex items-center gap-2">
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-primary rounded-full animate-typing" style={{ animationDelay: "0s" }} />
            <span className="w-2 h-2 bg-primary rounded-full animate-typing" style={{ animationDelay: "0.2s" }} />
            <span className="w-2 h-2 bg-primary rounded-full animate-typing" style={{ animationDelay: "0.4s" }} />
          </div>
        </div>
      </div>
    );
  }

  if (role === "user") {
    return (
      <div className="flex gap-3 justify-end animate-fade-in">
        <div className="message-user max-w-[80%]">
          <p className="text-sm whitespace-pre-wrap">{content}</p>
        </div>
        <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 animate-fade-in group">
      <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
        <Sparkles className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 max-w-[85%]">
        <div className="message-ai">
          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
            {content}
            {isStreaming && <span className="inline-block w-2 h-4 ml-1 bg-primary animate-pulse" />}
          </p>

          {sources && sources.length > 0 && (
            <div className="mt-4 pt-3 border-t border-border/50">
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                Sources from your notes
              </p>
              <div className="space-y-2">
                {sources.map((source, idx) => {
                  const title = typeof source === 'string' ? source : source.title;
                  const excerpt = typeof source === 'string' ? '' : source.excerpt;
                  return (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors cursor-pointer"
                    >
                      <p className="text-xs font-medium text-primary">{title}</p>
                      {excerpt && <p className="text-xs text-muted-foreground line-clamp-2">{excerpt}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleCopy}
          className={cn(
            "mt-2 p-1.5 rounded-lg text-muted-foreground hover:text-foreground",
            "hover:bg-secondary/50 transition-all opacity-0 group-hover:opacity-100"
          )}
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-primary" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </div>
  );
};
