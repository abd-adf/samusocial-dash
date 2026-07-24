"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Loader2, Download } from "lucide-react";
import Image from "next/image";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

// ── Types ───────────────────────────────────────────────────────────────────

interface ChartData {
  type: "bar" | "line";
  data: { name: string; value: number }[];
  label: string;
  color?: string;
}

interface MessageMeta {
  sources?: string[];
  followUps?: string[];
  chart?: ChartData;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  meta?: MessageMeta;
}

interface ChatWidgetProps {
  dateRange: { start: string; end: string };
  dashboardData: unknown;
}

type WidgetView = "ferme" | "accroche" | "ouvert";

// ── Constants ───────────────────────────────────────────────────────────────

const ACCENT = "#F15A24";
const ACCENT_GRAD = "linear-gradient(135deg, #FF7A3D, #EC4E1C)";
const CHIP_BG = "#FFF7F3";
const CHIP_BORDER = "#FFE0D2";
const CHIP_HOVER_BG = "#FFEDE3";
const CHIP_HOVER_BORDER = "#FFC9AE";
const MAX_QUESTIONS = 3;
const META_SEPARATOR = ":::META:::";

const SUGGESTIONS = [
  "Quel canal génère le plus de dons ?",
  "Résume la performance Meta Ads",
  "Compare novembre et décembre",
];

// ── Icons ───────────────────────────────────────────────────────────────────

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

const ExpandIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" stroke="rgba(255,255,255,.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ShrinkIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7" stroke="rgba(255,255,255,.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ── Helpers ─────────────────────────────────────────────────────────────────

function parseMetaFromContent(raw: string): { text: string; meta?: MessageMeta } {
  const idx = raw.indexOf(META_SEPARATOR);
  if (idx === -1) return { text: raw };

  const text = raw.slice(0, idx).trim();
  const jsonStr = raw.slice(idx + META_SEPARATOR.length).trim();

  try {
    const meta = JSON.parse(jsonStr) as MessageMeta;
    return { text, meta };
  } catch {
    return { text };
  }
}

// ── Mini Chart Component ────────────────────────────────────────────────────

function MiniChart({ chart }: { chart: ChartData }) {
  const color = chart.color || ACCENT;

  if (chart.type === "line") {
    return (
      <div style={{ width: "100%", height: 140, marginTop: 10 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chart.data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E3E6EB" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#8A93A2" }} />
            <YAxis tick={{ fontSize: 10, fill: "#8A93A2" }} />
            <Tooltip
              contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #E3E6EB" }}
              formatter={(value) => [Number(value).toLocaleString("fr-BE"), chart.label]}
            />
            <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={{ r: 3, fill: color }} />
          </LineChart>
        </ResponsiveContainer>
        <div style={{ textAlign: "center", fontSize: 10, color: "#8A93A2", marginTop: 2 }}>{chart.label}</div>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: 140, marginTop: 10 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chart.data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E3E6EB" />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#8A93A2" }} />
          <YAxis tick={{ fontSize: 10, fill: "#8A93A2" }} />
          <Tooltip
            contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #E3E6EB" }}
            formatter={(value) => [Number(value).toLocaleString("fr-BE"), chart.label]}
          />
          <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <div style={{ textAlign: "center", fontSize: 10, color: "#8A93A2", marginTop: 2 }}>{chart.label}</div>
    </div>
  );
}

// ── Source Badges ────────────────────────────────────────────────────────────

const SOURCE_COLORS: Record<string, string> = {
  "Meta Ads": "#1877F2",
  "Google Ads": "#4285F4",
  "GA4": "#E37400",
  "GA4 - Donations": "#10b981",
  "Mailchimp": "#FFE01B",
  "Rapport EOY": "#8b5cf6",
};

function SourceBadges({ sources }: { sources: string[] }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
      <span style={{ fontSize: 10, color: "#8A93A2", marginRight: 2, lineHeight: "20px" }}>Sources :</span>
      {sources.map((src) => {
        const color = SOURCE_COLORS[src] || "#6B7280";
        return (
          <span
            key={src}
            style={{
              fontSize: 10,
              fontWeight: 600,
              color,
              background: `${color}14`,
              border: `1px solid ${color}30`,
              borderRadius: 6,
              padding: "2px 7px",
              lineHeight: "16px",
            }}
          >
            {src}
          </span>
        );
      })}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

export default function ChatWidget({ dateRange, dashboardData }: ChatWidgetProps) {
  const [view, setView] = useState<WidgetView>("accroche");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatBodyRef = useRef<HTMLDivElement>(null);

  const sessionId = useMemo(() => `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, []);
  const isLimitReached = questionCount >= MAX_QUESTIONS;

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
    if (!msg || streaming || isLimitReached) return;

    const userMsg: Message = { role: "user", content: msg };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setStreaming(true);
    setQuestionCount((prev) => prev + 1);
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-session-id": sessionId },
        body: JSON.stringify({
          message: msg,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
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

      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullContent += chunk;

        // While streaming, show text without meta (hide :::META::: part as it arrives)
        const displayIdx = fullContent.indexOf(META_SEPARATOR);
        const displayText = displayIdx === -1 ? fullContent : fullContent.slice(0, displayIdx);

        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: displayText };
          return updated;
        });
      }

      // Once streaming is done, parse the meta block
      const { text, meta } = parseMetaFromContent(fullContent);
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: text, meta };
        return updated;
      });
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
    if (isLimitReached) return;
    setView("ouvert");
    sendMessage(suggestion);
  };

  const handleFollowUpClick = (question: string) => {
    if (isLimitReached) return;
    sendMessage(question);
  };

  // Export PDF
  const exportPDF = useCallback(async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const maxWidth = pageWidth - margin * 2;
    let y = 20;

    // Title
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Assistant Data — Conversation", margin, y);
    y += 8;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(130, 130, 130);
    doc.text(`Période : ${dateRange.start} au ${dateRange.end} — Exporté le ${new Date().toLocaleDateString("fr-BE")}`, margin, y);
    y += 10;

    doc.setTextColor(0, 0, 0);

    for (const msg of messages) {
      // Check page space
      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      const isUser = msg.role === "user";
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(isUser ? 241 : 42, isUser ? 90 : 47, isUser ? 36 : 58);
      doc.text(isUser ? "Vous" : "Assistant", margin, y);
      y += 5;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(40, 40, 40);
      doc.setFontSize(9);

      const lines = doc.splitTextToSize(msg.content, maxWidth);
      for (const line of lines) {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, margin, y);
        y += 4.5;
      }

      // Sources
      if (msg.meta?.sources?.length) {
        y += 2;
        doc.setFontSize(8);
        doc.setTextColor(130, 130, 130);
        doc.text(`Sources : ${msg.meta.sources.join(", ")}`, margin, y);
        y += 4;
      }

      y += 6;
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(160, 160, 160);
    doc.text("Généré par Assistant Data — Adfinitas Belgium", margin, 290);

    doc.save(`conversation-assistant-data-${new Date().toISOString().slice(0, 10)}.pdf`);
  }, [messages, dateRange]);

  // Dimensions based on expanded state
  const panelWidth = expanded ? 600 : 440;
  const panelMaxHeight = expanded ? "calc(100vh - 40px)" : "min(650px, calc(100vh - 120px))";

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3.5">
      <style>{`
        @keyframes chatPulse{0%{transform:scale(1);opacity:.45}70%{transform:scale(1.85);opacity:0}100%{opacity:0}}
        @keyframes chatIn{from{opacity:0;transform:translateY(10px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
      `}</style>

      {/* ── État accroche : mini-carte avec suggestions ── */}
      {view === "accroche" && (
        <div
          className="relative w-[340px] overflow-hidden"
          style={{
            background: "#fff",
            borderRadius: 18,
            boxShadow: "0 16px 40px rgba(20,20,40,.18)",
            border: "1px solid #F1E7E0",
            animation: "chatIn .35s ease",
          }}
        >
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
            width: panelWidth,
            maxHeight: panelMaxHeight,
            background: "#fff",
            borderRadius: 20,
            boxShadow: "0 24px 60px rgba(20,20,40,.24)",
            border: "1px solid #EFE3DC",
            animation: "chatIn .3s ease",
            transition: "width .3s ease, max-height .3s ease",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 relative shrink-0"
            style={{ padding: "16px 18px", background: ACCENT_GRAD }}
          >
            <div
              className="flex items-center justify-center shrink-0"
              style={{ width: 38, height: 38, borderRadius: 11, background: "rgba(255,255,255,.18)" }}
            >
              <ChatIconSmall />
            </div>
            <div>
              <div className="text-[15.5px] font-bold text-white">Assistant Data</div>
              <div className="text-[12px] mt-px" style={{ color: "rgba(255,255,255,.85)" }}>
                Posez vos questions sur les données
              </div>
            </div>
            <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5">
              {/* Export PDF */}
              {messages.length > 0 && !streaming && (
                <button
                  onClick={exportPDF}
                  aria-label="Exporter en PDF"
                  title="Exporter la conversation"
                  className="flex items-center justify-center border-none text-white cursor-pointer"
                  style={{ width: 26, height: 26, borderRadius: 8, background: "rgba(255,255,255,.2)" }}
                >
                  <Download size={14} strokeWidth={2} />
                </button>
              )}
              {/* Expand/shrink */}
              <button
                onClick={() => setExpanded((prev) => !prev)}
                aria-label={expanded ? "Réduire la fenêtre" : "Agrandir la fenêtre"}
                className="flex items-center justify-center border-none text-white cursor-pointer"
                style={{ width: 26, height: 26, borderRadius: 8, background: "rgba(255,255,255,.2)" }}
              >
                {expanded ? <ShrinkIcon /> : <ExpandIcon />}
              </button>
              {/* Close */}
              <button
                onClick={() => setView("accroche")}
                aria-label="Fermer"
                className="flex items-center justify-center border-none text-white text-[16px] leading-none cursor-pointer"
                style={{ width: 26, height: 26, borderRadius: 8, background: "rgba(255,255,255,.2)" }}
              >
                ×
              </button>
            </div>
          </div>

          {/* Messages / Suggestions */}
          <div ref={chatBodyRef} className="flex-1 overflow-y-auto" style={{ padding: "18px 18px 6px" }}>
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
                  <div key={i}>
                    <div className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
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

                        {/* Chart inline */}
                        {msg.meta?.chart && msg.meta.chart.data?.length > 0 && (
                          <MiniChart chart={msg.meta.chart} />
                        )}

                        {/* Sources */}
                        {msg.meta?.sources && msg.meta.sources.length > 0 && (
                          <SourceBadges sources={msg.meta.sources} />
                        )}
                      </div>
                    </div>

                    {/* Follow-up suggestions */}
                    {msg.meta?.followUps && msg.meta.followUps.length > 0 && !streaming && !isLimitReached && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8, paddingLeft: 4 }}>
                        {msg.meta.followUps.map((q) => (
                          <button
                            key={q}
                            onClick={() => handleFollowUpClick(q)}
                            style={{
                              padding: "6px 12px",
                              borderRadius: 10,
                              border: `1px solid ${CHIP_BORDER}`,
                              background: CHIP_BG,
                              color: ACCENT,
                              fontSize: 11.5,
                              fontWeight: 600,
                              cursor: "pointer",
                              fontFamily: "inherit",
                              transition: "all .15s ease",
                              textAlign: "left",
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
                            {q}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input or limit message */}
          {isLimitReached ? (
            <div
              style={{
                borderTop: "1px solid #F0F1F4",
                marginTop: 12,
                overflow: "hidden",
              }}
            >
              {/* Photo bandeau — full width, pas de crop circulaire */}
              <div style={{ position: "relative", width: "100%", height: 180, overflow: "hidden" }}>
                <Image
                  src="/contact-adfinitas.jpg"
                  alt="Alain Bourdil & Stefaan Nechelput - Adfinitas"
                  fill
                  style={{ objectFit: "cover", objectPosition: "center 30%" }}
                />
                {/* Dégradé bas pour transition douce vers le texte */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 60,
                    background: "linear-gradient(to top, #fff 0%, transparent 100%)",
                  }}
                />
              </div>

              {/* Contenu texte + CTA */}
              <div style={{ padding: "0 22px 22px", textAlign: "center", marginTop: -10 }}>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 800,
                    color: "#2A2F3A",
                    marginBottom: 2,
                  }}
                >
                  Envie d&apos;aller plus loin ?
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: ACCENT,
                    marginBottom: 10,
                  }}
                >
                  Alain Bourdil & Stefaan Nechelput
                </div>
                <div
                  style={{
                    fontSize: 12.5,
                    color: "#6B7280",
                    lineHeight: 1.55,
                    marginBottom: 18,
                  }}
                >
                  Vous avez utilisé vos {MAX_QUESTIONS} questions.
                  Contactez-nous pour une analyse approfondie de vos résultats et des recommandations sur mesure.
                </div>
                <a
                  href="mailto:abourdil@adfinitas.be"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "13px 28px",
                    borderRadius: 13,
                    background: ACCENT_GRAD,
                    color: "#fff",
                    fontSize: 13.5,
                    fontWeight: 700,
                    textDecoration: "none",
                    boxShadow: "0 6px 20px rgba(241,90,36,.3)",
                    transition: "transform .15s ease, box-shadow .15s ease",
                    fontFamily: "inherit",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 8px 28px rgba(241,90,36,.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 6px 20px rgba(241,90,36,.3)";
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <rect x="2" y="4" width="20" height="16" rx="3" stroke="#fff" strokeWidth="1.8"/>
                    <path d="M2 7l10 7 10-7" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Nous contacter
                </a>
              </div>
            </div>
          ) : (
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
          )}
        </div>
      )}

      {/* ── FAB (bouton flottant) ── */}
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
