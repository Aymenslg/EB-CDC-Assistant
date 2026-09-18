"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles } from "lucide-react";
import { askQuestionStream } from "@/lib/api/aiEngineClient";
import type { ChatMessage } from "@/types/chat";

export default function ChatPage() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    async function handleSend() {
        const question = input.trim();
        if (!question || loading) return;

        const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", content: question };
        const assistantId = crypto.randomUUID();
        setMessages((prev) => [...prev, userMessage, { id: assistantId, role: "assistant", content: "" }]);
        setInput("");
        setLoading(true);
        setError(null);

        try {
            await askQuestionStream({ question }, (chunk) => {
                setMessages((prev) =>
                    prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + chunk } : m))
                );
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erreur inconnue");
            setMessages((prev) => prev.filter((m) => m.id !== assistantId));
        } finally {
            setLoading(false);
        }
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }

    return (
        <div className="flex flex-col h-full p-6 lg:p-7">
            <div className="mb-4">
                <h1 className="text-[17px] font-medium text-foreground mb-0.5">Chat RAG</h1>
                <p className="text-xs text-text-secondary">Posez une question sur vos documents indexés</p>
            </div>

            <div className="flex-1 overflow-y-auto bg-surface border border-border-subtle rounded-[10px] p-5 flex flex-col gap-4 mb-4">
                {messages.length === 0 && (
                    <div className="m-auto text-center flex flex-col items-center gap-2">
                        <Sparkles size={22} className="text-atos-blue" />
                        <p className="text-sm text-text-secondary max-w-xs">
                            Posez votre première question sur les EB et CDC indexés.
                        </p>
                    </div>
                )}

                {messages.map((msg) => (
                    <div key={msg.id} className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        {msg.role === "assistant" && (
                            <div className="w-6 h-6 rounded-full bg-atos-blue text-white flex items-center justify-center text-[10px] font-medium flex-shrink-0 mt-0.5">
                                EB
                            </div>
                        )}
                        <div
                            className={`max-w-[75%] rounded-lg px-3.5 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${
                                msg.role === "user"
                                    ? "bg-atos-blue text-white"
                                    : "bg-background text-foreground border border-border-subtle"
                            }`}
                        >
                            {msg.content}
                            {msg.role === "assistant" && loading && msg.content === "" && (
                                <span className="inline-flex gap-1 py-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-text-secondary animate-[dot-bounce_1.2s_infinite]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-text-secondary animate-[dot-bounce_1.2s_infinite]" style={{ animationDelay: "0.15s" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-text-secondary animate-[dot-bounce_1.2s_infinite]" style={{ animationDelay: "0.3s" }} />
                </span>
                            )}
                        </div>
                    </div>
                ))}

                <div ref={bottomRef} />
            </div>

            {error && <p className="text-xs text-danger-text mb-2">{error}</p>}

            <div className="flex gap-2 items-end">
        <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Posez votre question..."
            rows={1}
            className="flex-1 text-sm border border-border-subtle rounded-md px-3 py-2.5 resize-none focus:outline-none focus:ring-1 focus:ring-atos-blue"
        />
                <button
                    onClick={handleSend}
                    disabled={loading || !input.trim()}
                    className="flex items-center justify-center bg-atos-blue text-white rounded-md w-10 h-10 flex-shrink-0 hover:bg-atos-blue-dark transition-colors disabled:opacity-50"
                >
                    <Send size={16} />
                </button>
            </div>
        </div>
    );
}