"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Sparkles } from "lucide-react";
import { askQuestionStream } from "@/lib/api/aiEngineClient";
import type { ChatMessage } from "@/types/chat";

export default function DocumentChatWidget({ documentId }: { documentId: number }) {
  const [open, setOpen] = useState(false);
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
      await askQuestionStream({ question, document_id: documentId }, (chunk) => {
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
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-40 flex items-center justify-center w-12 h-12 rounded-full bg-[#0066A1] text-white shadow-lg hover:bg-[#0A2540] transition-colors"
        aria-label="Ouvrir le chat sur ce document"
      >
        {open ? <X size={20} /> : <MessageCircle size={20} />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-40 w-[360px] h-[480px] bg-surface border border-border-subtle rounded-[10px] shadow-xl flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-border-subtle bg-[#0A2540]">
            <p className="text-sm font-medium text-white">Poser une question sur ce document</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {messages.length === 0 && (
              <div className="m-auto text-center flex flex-col items-center gap-2">
                <Sparkles size={20} className="text-atos-blue" />
                <p className="text-xs text-text-secondary max-w-[220px]">
                  Posez une question sur le contenu de ce document précis.
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-xs whitespace-pre-wrap leading-relaxed ${
                    msg.role === "user"
                      ? "bg-atos-blue text-white"
                      : "bg-background text-foreground border border-border-subtle"
                  }`}
                >
                  {msg.content}
                  {msg.role === "assistant" && loading && msg.content === "" && (
                    <span className="inline-flex gap-1 py-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-text-secondary animate-pulse" />
                      <span className="w-1.5 h-1.5 rounded-full bg-text-secondary animate-pulse" />
                      <span className="w-1.5 h-1.5 rounded-full bg-text-secondary animate-pulse" />
                    </span>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {error && <p className="text-xs text-danger-text px-4 pb-1">{error}</p>}

          <div className="flex gap-2 items-end p-3 border-t border-border-subtle">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Votre question..."
              rows={1}
              className="flex-1 text-xs border border-border-subtle rounded-md px-2.5 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-atos-blue"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="flex items-center justify-center bg-atos-blue text-white rounded-md w-9 h-9 flex-shrink-0 hover:bg-atos-blue-dark transition-colors disabled:opacity-50"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
