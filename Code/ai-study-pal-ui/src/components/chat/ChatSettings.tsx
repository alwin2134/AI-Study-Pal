import { useState, useEffect } from "react";
import { Settings, Key, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatSettingsProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (keys: { openai?: string; gemini?: string }) => void;
    initialKeys: { openai?: string; gemini?: string };
}

export const ChatSettings = ({ isOpen, onClose, onSave, initialKeys }: ChatSettingsProps) => {
    const [keys, setKeys] = useState(initialKeys);

    useEffect(() => {
        setKeys(initialKeys);
    }, [initialKeys, isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
            <div className="bg-card w-full max-w-md rounded-2xl border border-border/50 shadow-2xl p-6 relative">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-xl font-semibold flex items-center gap-2 mb-6">
                    <Settings className="w-5 h-5 text-primary" />
                    AI Providers Setup
                </h2>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <Key className="w-4 h-4 text-orange-500" />
                            Gemini API Key
                        </label>
                        <input
                            type="password"
                            value={keys.gemini || ""}
                            onChange={(e) => setKeys({ ...keys, gemini: e.target.value })}
                            placeholder="AIzaSy..."
                            className="w-full px-4 py-2 rounded-xl bg-secondary/50 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                        />
                        <p className="text-xs text-muted-foreground">
                            Required for Google Gemini integration.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <Key className="w-4 h-4 text-blue-500" />
                            OpenAI API Key
                        </label>
                        <input
                            type="password"
                            value={keys.openai || ""}
                            onChange={(e) => setKeys({ ...keys, openai: e.target.value })}
                            placeholder="sk-..."
                            className="w-full px-4 py-2 rounded-xl bg-secondary/50 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                        />
                        <p className="text-xs text-muted-foreground">
                            Required for GPT-3.5/4 integration.
                        </p>
                    </div>
                </div>

                <div className="mt-8 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:bg-secondary/50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            onSave(keys);
                            onClose();
                        }}
                        className="px-4 py-2 rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all"
                    >
                        Save Keys
                    </button>
                </div>
            </div>
        </div>
    );
};
