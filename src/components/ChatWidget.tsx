"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatWidgetProps {
  dateRange: { start: string; end: string };
  dashboardData: unknown;
}

type WidgetView = "ferme" | "accroche" | "ouvert";

const ACCENT = "#F15A24";
const ACCENT_GRAD = "linear-gradient(135deg, #FF7A3D, #EC4E1C)";
const CHIP_BG = "#FFF7F3";
const CHIP_BORDER = "#FFE0D2";
const CHIP_HOVER_BG = "#FFEDE3";
const CHIP_HOVER_BORDER = "#FFC9AE";

const SUGGESTIONS = [
  "Quel canal génère le plus de dons ?",
  "Résume la performance Meta Ads",
  "Compare novembre et décembre",
];

const ChatIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.45L3 20.5l1.6-5A8.5 8.5 0 1 1 21 11.5Z" stroke="#fff" strokeWidth="1.7" strokeLinejoin="round"/>
    <circle cx="8.5" cy="11.6" r="1.05" fill="#fff"/>
    <circle cx="12" cy="11.6" r="1.05" fill="#fff"/>
    <circle cx="15.5" cy="11.6" r="1.05" fill="#fff"/>
  </svg>
);

const ChatIconSmall = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.45L3 20.5l1.6-5A8.5 8.5 0 1 1 21 11.5Z" stroke="#fff" strokeWidth="1.7" strokeLinejoin="round"/>
    <circle cx="8.5" cy="11.6" r="1.05" fill="#fff"/>
    <circle cx="12" cy="11.6" r="1.05" fill="#fff"/>
    <circle cx="15.5" cy="11.6" r="1.05" fill="#fff"/>
  </svg>
);

const SendIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
    <path d="M5 12h13M12 5l7 7-7 7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ChevronIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
    <path d="M9 6l6 6-6 6" stroke={ACCENT} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function ChatWidget({ dateRange, dashboardData }: ChatWidgetProps) {
  const [view, setView] = useState<WidgetView>("accroche");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (view === "ouvert") inputRef.current?.focus();
  }, [view]);

  const sendMessage = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || streaming) return;

    const userMsg: Message = { role: "user", content: msg };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setStreaming(true);
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          history: messages,
          dashboardData,
          dateRange,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Erreur serveur" }));
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: `Erreur : ${err.error || "Impossible de contacter le serveur."}`,
          };
          return updated;
        });
        setStreaming(false);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No reader");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          updated[updated.length - 1] = { ...last, content: last.content + chunk };
          return updated;
        });
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "Erreur de connexion. Réessayez.",
        };
        return updated;
      });
    } finally {
      setStreaming(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setView("ouvert");
    sendMessage(suggestion);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3.5">
      <style>{`
        @keyframes chatPulse{0%{transform:scale(1);opacity:.45}70%{transform:scale(1.85);opacity:0}100%{opacity:0}}
        @keyframes chatIn{from{opacity:0;transform:translateY(10px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
      `}</style>

      {/* ── État accroche : mini-carte avec suggestions ── */}
      {view === "accroche" && (
        <div
          className="relative w-[300px] overflow-hidden"
          style={{
            background: "#fff",
            borderRadius: 18,
            boxShadow: "0 16px 40px rgba(20,20,40,.18)",
            border: "1px solid #F1E7E0",
            animation: "chatIn .35s ease",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-2.5 px-4 py-3.5"
            style={{ background: ACCENT_GRAD }}
          >
            <span
              className="flex items-center justify-center shrink-0"
              style={{ width: 28, height: 28, borderRadius: 9, background: "rgba(255,255,255,.2)" }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                <path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.45L3 20.5l1.6-5A8.5 8.5 0 1 1 21 11.5Z" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round"/>
              </svg>
            </span>
            <span className="flex-1 text-[14px] font-bold text-white">Assistant Data</span>
            <button
              onClick={() => setView("ferme")}
              aria-label="Réduire"
              className="flex items-center justify-center shrink-0 cursor-pointer border-none text-white text-[15px] leading-none"
              style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(255,255,255,.22)" }}
            >
              ×
            </button>
          </div>

          {/* Suggestions */}
          <div className="px-4 py-3.5">
            <div className="text-[12.5px] mb-2.5" style={{ color: "#8A93A2" }}>
              Une question rapide sur vos données ?
            </div>
            {SUGGESTIONS.slice(0, 2).map((s) => (
              <button
                key={s}
                onClick={() => handleSuggestionClick(s)}
                className="flex w-full text-left cursor-pointer mb-2 last:mb-0 transition-colors"
                style={{
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: `1px solid ${CHIP_BORDER}`,
                  background: CHIP_BG,
                  color: "#2A2F3A",
                  fontSize: "13px",
                  fontWeight: 600,
                  fontFamily: "inherit",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = CHIP_HOVER_BG;
                  e.currentTarget.style.borderColor = CHIP_HOVER_BORDER;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = CHIP_BG;
                  e.currentTarget.style.borderColor = CHIP_BORDER;
                }}
              >
                {s}
              </button>
            ))}
            <button
              onClick={() => setView("ouvert")}
              className="flex items-center gap-1.5 mt-3 border-none bg-none cursor-pointer p-0"
              style={{ color: ACCENT, fontSize: "12.5px", fontWeight: 700, fontFamily: "inherit", background: "none" }}
            >
              Poser ma propre question
              <ChevronIcon />
            </button>
          </div>
        </div>
      )}

      {/* ── État ouvert : panneau complet ── */}
      {view === "ouvert" && (
        <div
          className="flex flex-col overflow-hidden"
          style={{
            width: 372,
            maxHeight: "min(580px, calc(100vh - 120px))",
            background: "#fff",
            borderRadius: 20,
            boxShadow: "0 24px 60px rgba(20,20,40,.24)",
            border: "1px solid #EFE3DC",
            animation: "chatIn .3s ease",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 relative shrink-0"
            style={{ padding: "16px 18px", background: ACCENT_GRAD }}
          >
            <div
              className="flex items-center justify-center shrink-0 overflow-hidden"
              style={{ width: 38, height: 38, borderRadius: 11, background: "rgba(255,255,255,.18)" }}
            >
              <img src="/logos/adfinitas.png" alt="Adfinitas" width={28} height={28} style={{ objectFit: "contain" }} />
            </div>
            <div>
              <div className="text-[15.5px] font-bold text-white">Assistant Data</div>
              <div className="text-[12px] mt-px" style={{ color: "rgba(255,255,255,.85)" }}>
                Posez vos questions sur les données
              </div>
            </div>
            <button
              onClick={() => setView("accroche")}
              aria-label="Fermer"
              className="absolute top-3.5 right-3.5 flex items-center justify-center border-none text-white text-[16px] leading-none cursor-pointer"
              style={{ width: 26, height: 26, borderRadius: 8, background: "rgba(255,255,255,.2)" }}
            >
              ×
            </button>
          </div>

          {/* Messages / Suggestions */}
          <div className="flex-1 overflow-y-auto" style={{ padding: "18px 18px 6px" }}>
            {messages.length === 0 ? (
              <>
                <div className="text-[12.5px] mb-3" style={{ color: "#8A93A2" }}>
                  Posez une question sur les données du dashboard :
                </div>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSuggestionClick(s)}
                    className="flex w-full text-left cursor-pointer mb-2.5 last:mb-0 transition-colors"
                    style={{
                      padding: "13px 15px",
                      borderRadius: 13,
                      border: `1px solid ${CHIP_BORDER}`,
                      background: CHIP_BG,
                      color: "#2A2F3A",
                      fontSize: "13.5px",
                      fontWeight: 600,
                      fontFamily: "inherit",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = CHIP_HOVER_BG;
                      e.currentTarget.style.borderColor = CHIP_HOVER_BORDER;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = CHIP_BG;
                      e.currentTarget.style.borderColor = CHIP_BORDER;
                    }}
                  >
                    {s}
                  </button>
                ))}
              </>
            ) : (
              <div className="space-y-3">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className="max-w-[85%] px-3.5 py-2.5 text-[13.5px] whitespace-pre-wrap leading-relaxed"
                      style={
                        msg.role === "user"
                          ? {
                              background: ACCENT_GRAD,
                              color: "#fff",
                              borderRadius: "13px 13px 4px 13px",
                            }
                          : {
                              background: "#F4F5F7",
                              color: "#2A2F3A",
                              borderRadius: "13px 13px 13px 4px",
                              border: "1px solid #E3E6EB",
                            }
                      }
                    >
                      {msg.content || (
                        <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#8A93A2" }} />
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input */}
          <div
            className="flex gap-2.5 shrink-0"
            style={{ padding: "14px 16px", borderTop: "1px solid #F0F1F4", marginTop: 12 }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Votre question..."
              disabled={streaming}
              className="flex-1 outline-none disabled:opacity-50"
              style={{
                border: "1px solid #E3E6EB",
                borderRadius: 13,
                padding: "12px 14px",
                fontSize: 13,
                fontFamily: "inherit",
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={streaming || !input.trim()}
              aria-label="Envoyer"
              className="shrink-0 flex items-center justify-center border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                width: 44,
                height: 44,
                borderRadius: 13,
                background: ACCENT_GRAD,
              }}
            >
              {streaming ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <SendIcon />
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── FAB (bouton flottant) — visible dans tous les états sauf ouvert ── */}
      {view !== "ouvert" && (
        <div className="relative" style={{ width: 68, height: 68 }}>
          <div
            className="absolute inset-0 rounded-full"
            style={{ background: ACCENT, animation: "chatPulse 2.4s ease-out infinite" }}
          />
          <button
            onClick={() => setView("ouvert")}
            aria-label="Ouvrir l'assistant"
            className="relative flex items-center justify-center border-none cursor-pointer"
            style={{
              width: 68,
              height: 68,
              borderRadius: "50%",
              background: ACCENT_GRAD,
              boxShadow: "0 12px 26px rgba(241,90,36,.45)",
            }}
          >
            <ChatIcon />
          </button>
        </div>
      )}
    </div>
  );
}
