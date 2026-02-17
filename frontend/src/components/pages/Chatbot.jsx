import { useState, useEffect, useRef } from "react";
import {
  getChatDates,
  getChatHistory,
  sendMessageStream,
} from "../../services/chatService";

// -------- Icons --------
const SendIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);

const BotIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path d="M12 2a2 2 0 012 2v1h3a3 3 0 013 3v8a3 3 0 01-3 3H7a3 3 0 01-3-3V8a3 3 0 013-3h3V4a2 2 0 012-2z" />
    <circle cx="9" cy="11" r="1.5" fill="currentColor" />
    <circle cx="15" cy="11" r="1.5" fill="currentColor" />
    <path d="M9 15h6" strokeLinecap="round" />
  </svg>
);

const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <circle cx="12" cy="8" r="4" />
    <path d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
  </svg>
);

const ChevronIcon = ({ open }) => (
  <svg
    width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={2}
    style={{
      transform: open ? "rotate(180deg)" : "rotate(0deg)",
      transition: "transform 0.3s ease"
    }}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

// -------- Helper: format date --------
function formatDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  if (dateStr === todayStr) return "Today";
  if (dateStr === yesterdayStr) return "Yesterday";

  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

// -------- Typing indicator dots --------
function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 4, padding: "4px 0" }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #818cf8, #a78bfa)",
            animation: `typingBounce 1.2s ease-in-out ${i * 0.15}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

// =============== MAIN CHATBOT COMPONENT ===============
export default function Chatbot() {
  const [dates, setDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showDates, setShowDates] = useState(false);
  const [loading, setLoading] = useState(true);

  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // -------- Load dates on mount --------
  useEffect(() => {
    loadDates();
  }, []);

  // -------- Load messages when date changes --------
  useEffect(() => {
    loadMessages(selectedDate);
  }, [selectedDate]);

  // -------- Auto-scroll --------
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadDates() {
    try {
      const data = await getChatDates();
      const allDates = data.dates || [];
      const today = getTodayDate();
      if (!allDates.includes(today)) {
        allDates.unshift(today);
      }
      setDates(allDates);
    } catch (err) {
      console.error("Failed to load dates:", err);
    }
  }

  async function loadMessages(date) {
    setLoading(true);
    try {
      const data = await getChatHistory(date);
      setMessages(data.messages || []);
    } catch (err) {
      console.error("Failed to load messages:", err);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }

  // -------- Send message with streaming --------
  async function handleSend() {
    if (!input.trim() || isStreaming) return;

    const userMsg = input.trim();
    setInput("");
    setSelectedDate(getTodayDate());

    // Add user message locally
    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMsg, createdAt: new Date().toISOString() },
    ]);

    setIsStreaming(true);

    // Add empty assistant message placeholder
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "", createdAt: new Date().toISOString(), streaming: true },
    ]);

    try {
      const response = await sendMessageStream(userMsg);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;

          try {
            const parsed = JSON.parse(jsonStr);

            if (parsed.chunk) {
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.role === "assistant") {
                  updated[updated.length - 1] = {
                    ...last,
                    content: last.content + parsed.chunk,
                  };
                }
                return updated;
              });
            }

            if (parsed.done) {
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last) {
                  updated[updated.length - 1] = { ...last, streaming: false };
                }
                return updated;
              });
            }

            if (parsed.error) {
              console.error("Stream error:", parsed.error);
            }
          } catch (e) {
            // skip invalid JSON
          }
        }
      }
    } catch (err) {
      console.error("Send failed:", err);
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && last.role === "assistant") {
          updated[updated.length - 1] = {
            ...last,
            content: "Sorry, something went wrong. Please try again.",
            streaming: false,
          };
        }
        return updated;
      });
    } finally {
      setIsStreaming(false);
      loadDates();
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const isToday = selectedDate === getTodayDate();

  return (
    <>
      {/* Inline keyframe styles */}
      <style>{`
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30% { transform: translateY(-8px); opacity: 1; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(129,140,248,0.15); }
          50% { box-shadow: 0 0 35px rgba(129,140,248,0.3); }
        }
        .chat-bubble-user {
          animation: fadeInUp 0.3s ease-out;
        }
        .chat-bubble-ai {
          animation: fadeInUp 0.4s ease-out;
        }
        .date-chip {
          transition: all 0.2s ease;
        }
        .date-chip:hover {
          transform: translateX(4px);
        }
        .send-btn:hover:not(:disabled) {
          transform: scale(1.05);
          box-shadow: 0 8px 25px rgba(129,140,248,0.4);
        }
        .send-btn:active:not(:disabled) {
          transform: scale(0.97);
        }
        .chat-input-area:focus-within {
          border-color: rgba(129,140,248,0.5);
          box-shadow: 0 0 0 3px rgba(129,140,248,0.1);
        }
      `}</style>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "calc(100vh - 4rem)",
          maxWidth: 900,
          margin: "0 auto",
          fontFamily: "'Inter', 'Segoe UI', sans-serif",
        }}
      >
        {/* ============ HEADER ============ */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            background: "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(241,245,249,0.95))",
            backdropFilter: "blur(20px)",
            borderRadius: 16,
            marginBottom: 12,
            border: "1px solid rgba(148,163,184,0.15)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: "linear-gradient(135deg, #818cf8, #6366f1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                boxShadow: "0 4px 15px rgba(99,102,241,0.3)",
              }}
            >
              <BotIcon />
            </div>
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#1e293b",
                  letterSpacing: "-0.02em",
                }}
              >
                Health Assistant
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  color: "#94a3b8",
                  fontWeight: 500,
                }}
              >
                Personalized health advice • Powered by AI
              </p>
            </div>
          </div>

          {/* Date toggle */}
          <button
            onClick={() => setShowDates(!showDates)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 14px",
              borderRadius: 10,
              border: "1px solid rgba(148,163,184,0.2)",
              background: showDates
                ? "linear-gradient(135deg, #818cf8, #6366f1)"
                : "white",
              color: showDates ? "white" : "#475569",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              transition: "all 0.3s ease",
              boxShadow: showDates
                ? "0 4px 15px rgba(99,102,241,0.3)"
                : "0 2px 8px rgba(0,0,0,0.04)",
            }}
          >
            <CalendarIcon />
            {formatDate(selectedDate)}
            <ChevronIcon open={showDates} />
          </button>
        </div>

        {/* ============ DATE PICKER DROPDOWN ============ */}
        {showDates && (
          <div
            style={{
              background: "rgba(255,255,255,0.97)",
              backdropFilter: "blur(20px)",
              borderRadius: 14,
              padding: 12,
              marginBottom: 12,
              border: "1px solid rgba(148,163,184,0.12)",
              boxShadow: "0 8px 30px rgba(0,0,0,0.06)",
              maxHeight: 200,
              overflowY: "auto",
              animation: "fadeInUp 0.25s ease-out",
            }}
          >
            <p
              style={{
                margin: "0 0 8px 4px",
                fontSize: 11,
                fontWeight: 700,
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Chat History
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {dates.map((d) => (
                <button
                  key={d}
                  className="date-chip"
                  onClick={() => {
                    setSelectedDate(d);
                    setShowDates(false);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "none",
                    background:
                      d === selectedDate
                        ? "linear-gradient(135deg, #818cf8, #6366f1)"
                        : "transparent",
                    color: d === selectedDate ? "white" : "#475569",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: d === selectedDate ? 600 : 500,
                    textAlign: "left",
                  }}
                >
                  <CalendarIcon />
                  {formatDate(d)}
                  <span
                    style={{
                      marginLeft: "auto",
                      fontSize: 11,
                      opacity: 0.6,
                    }}
                  >
                    {d}
                  </span>
                </button>
              ))}
              {dates.length === 0 && (
                <p style={{ padding: 12, color: "#94a3b8", fontSize: 13, textAlign: "center" }}>
                  No chat history yet
                </p>
              )}
            </div>
          </div>
        )}

        {/* ============ CHAT MESSAGES ============ */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px 4px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {loading ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flex: 1,
                color: "#94a3b8",
                fontSize: 14,
              }}
            >
              Loading messages...
            </div>
          ) : messages.length === 0 ? (
            /* -------- Empty state -------- */
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                flex: 1,
                gap: 16,
                padding: 40,
              }}
            >
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 20,
                  background: "linear-gradient(135deg, #818cf8, #6366f1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  boxShadow: "0 8px 30px rgba(99,102,241,0.25)",
                  animation: "pulse-glow 3s ease-in-out infinite",
                }}
              >
                <BotIcon />
              </div>
              <h3
                style={{
                  margin: 0,
                  fontSize: 20,
                  fontWeight: 700,
                  color: "#1e293b",
                }}
              >
                {isToday ? "Start a Conversation" : `No chats on ${formatDate(selectedDate)}`}
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  color: "#94a3b8",
                  textAlign: "center",
                  maxWidth: 360,
                  lineHeight: 1.5,
                }}
              >
                {isToday
                  ? "Ask me anything about your health — nutrition, exercise, skin care, sleep tips, and more!"
                  : "Select today's date to start a new conversation."}
              </p>
              {isToday && (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                    justifyContent: "center",
                    marginTop: 8,
                  }}
                >
                  {[
                    "💪 Workout for my goals",
                    "🥗 Diet suggestions",
                    "😴 Sleep improvement tips",
                    "✨ Skin care routine",
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => {
                        setInput(suggestion);
                        inputRef.current?.focus();
                      }}
                      style={{
                        padding: "8px 14px",
                        borderRadius: 20,
                        border: "1px solid rgba(148,163,184,0.2)",
                        background: "rgba(255,255,255,0.8)",
                        color: "#475569",
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 500,
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = "linear-gradient(135deg, #818cf8, #6366f1)";
                        e.target.style.color = "white";
                        e.target.style.borderColor = "transparent";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = "rgba(255,255,255,0.8)";
                        e.target.style.color = "#475569";
                        e.target.style.borderColor = "rgba(148,163,184,0.2)";
                      }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* -------- Messages -------- */
            messages.map((msg, i) => (
              <div
                key={i}
                className={msg.role === "user" ? "chat-bubble-user" : "chat-bubble-ai"}
                style={{
                  display: "flex",
                  flexDirection: msg.role === "user" ? "row-reverse" : "row",
                  gap: 10,
                  alignItems: "flex-start",
                  paddingLeft: msg.role === "user" ? 40 : 0,
                  paddingRight: msg.role === "user" ? 0 : 40,
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: 34,
                    height: 34,
                    minWidth: 34,
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background:
                      msg.role === "user"
                        ? "linear-gradient(135deg, #3b82f6, #2563eb)"
                        : "linear-gradient(135deg, #818cf8, #6366f1)",
                    color: "white",
                    boxShadow:
                      msg.role === "user"
                        ? "0 3px 12px rgba(37,99,235,0.25)"
                        : "0 3px 12px rgba(99,102,241,0.25)",
                  }}
                >
                  {msg.role === "user" ? <UserIcon /> : <BotIcon />}
                </div>

                {/* Bubble */}
                <div
                  style={{
                    padding: "12px 16px",
                    borderRadius:
                      msg.role === "user"
                        ? "14px 14px 4px 14px"
                        : "14px 14px 14px 4px",
                    background:
                      msg.role === "user"
                        ? "linear-gradient(135deg, #3b82f6, #2563eb)"
                        : "rgba(255,255,255,0.95)",
                    color: msg.role === "user" ? "white" : "#334155",
                    fontSize: 14,
                    lineHeight: 1.6,
                    maxWidth: "100%",
                    wordBreak: "break-word",
                    border:
                      msg.role === "user"
                        ? "none"
                        : "1px solid rgba(148,163,184,0.12)",
                    boxShadow:
                      msg.role === "user"
                        ? "0 4px 15px rgba(37,99,235,0.2)"
                        : "0 4px 15px rgba(0,0,0,0.04)",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {msg.content || (msg.streaming ? <TypingDots /> : "")}

                  {/* Time */}
                  {msg.createdAt && (
                    <div
                      style={{
                        marginTop: 6,
                        fontSize: 10,
                        opacity: 0.5,
                        textAlign: msg.role === "user" ? "right" : "left",
                      }}
                    >
                      {formatTime(msg.createdAt)}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={chatEndRef} />
        </div>

        {/* ============ INPUT BAR ============ */}
        <div
          className="chat-input-area"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 16px",
            background: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(20px)",
            borderRadius: 16,
            border: "1px solid rgba(148,163,184,0.15)",
            boxShadow: "0 -4px 20px rgba(0,0,0,0.03)",
            transition: "all 0.3s ease",
            marginTop: 8,
            opacity: isToday ? 1 : 0.5,
            pointerEvents: isToday ? "auto" : "none",
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isToday
                ? "Ask about your health..."
                : "Switch to today to send messages"
            }
            disabled={isStreaming || !isToday}
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              fontSize: 14,
              color: "#1e293b",
              background: "transparent",
              fontFamily: "'Inter', sans-serif",
              fontWeight: 500,
            }}
          />
          <button
            className="send-btn"
            onClick={handleSend}
            disabled={!input.trim() || isStreaming || !isToday}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              border: "none",
              background:
                input.trim() && !isStreaming
                  ? "linear-gradient(135deg, #818cf8, #6366f1)"
                  : "rgba(148,163,184,0.15)",
              color: input.trim() && !isStreaming ? "white" : "#94a3b8",
              cursor:
                input.trim() && !isStreaming ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.3s ease",
              flexShrink: 0,
            }}
          >
            {isStreaming ? <TypingDots /> : <SendIcon />}
          </button>
        </div>
      </div>
    </>
  );
}
