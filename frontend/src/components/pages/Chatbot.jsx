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

// -------- Format message content with bullet points --------
function formatMessageContent(content) {
  if (!content) return "";
  
  // Split by newlines and process each line
  const lines = content.split('\n');
  
  return lines.map((line, index) => {
    const trimmedLine = line.trim();
    
    // Check if line starts with asterisk (bullet point)
    if (trimmedLine.startsWith('*')) {
      const text = trimmedLine.substring(1).trim();
      return (
        <div key={index} className="flex items-start gap-2 my-1">
          <span className="text-blue-400 mt-1.5">•</span>
          <span>{text}</span>
        </div>
      );
    }
    
    // Regular line
    return <div key={index} className="my-1">{trimmedLine}</div>;
  });
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

  useEffect(() => { loadDates(); }, []);
  useEffect(() => { loadMessages(selectedDate); }, [selectedDate]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function loadDates() {
    try {
      const data = await getChatDates();
      const allDates = data.dates || [];
      const today = getTodayDate();
      if (!allDates.includes(today)) allDates.unshift(today);
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

  async function handleSend() {
    if (!input.trim() || isStreaming) return;

    const userMsg = input.trim();
    setInput("");
    setSelectedDate(getTodayDate());

    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMsg, createdAt: new Date().toISOString() },
    ]);

    setIsStreaming(true);

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
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-[900px] mx-auto font-sans text-white">

      {/* ============ HEADER ============ */}
      <div className="flex items-center justify-between px-5 py-4 bg-[#1a1f2e]/90 backdrop-blur-sm rounded-2xl mb-3 border border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-[42px] h-[42px] rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg">
            <BotIcon />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Health Assistant
            </h2>
            <p className="text-xs text-gray-400 font-medium">
              Personalized health advice • Powered by AI
            </p>
          </div>
        </div>

        {/* Date toggle */}
        <button
          onClick={() => setShowDates(!showDates)}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all border ${
            showDates
              ? 'bg-blue-600 text-white border-blue-500'
              : 'bg-[#1a1f2e] text-gray-300 border-white/10 hover:border-blue-500/50'
          }`}
        >
          <CalendarIcon />
          {formatDate(selectedDate)}
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth={2}
            className={`transition-transform duration-200 ${showDates ? 'rotate-180' : 'rotate-0'}`}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* ============ DATE PICKER DROPDOWN ============ */}
      {showDates && (
        <div className="bg-[#1a1f2e]/95 backdrop-blur-sm rounded-2xl p-3 mb-3 border border-white/10 shadow-xl max-h-[200px] overflow-y-auto">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">
            Chat History
          </p>
          <div className="flex flex-col gap-1">
            {dates.map((d) => (
              <button
                key={d}
                onClick={() => {
                  setSelectedDate(d);
                  setShowDates(false);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  d === selectedDate
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-white/5'
                }`}
              >
                <CalendarIcon />
                {formatDate(d)}
                <span className="ml-auto text-xs opacity-60">{d}</span>
              </button>
            ))}
            {dates.length === 0 && (
              <p className="py-3 text-center text-gray-500 text-sm">
                No chat history yet
              </p>
            )}
          </div>
        </div>
      )}

      {/* ============ CHAT MESSAGES ============ */}
      <div className="flex-1 overflow-y-auto px-1 py-4 flex flex-col gap-4">
        {loading ? (
          <div className="flex items-center justify-center flex-1 text-gray-400 text-sm">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-3" />
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          /* -------- Empty state -------- */
          <div className="flex flex-col items-center justify-center flex-1 gap-4 py-10">
            <div className="w-[72px] h-[72px] rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg">
              <BotIcon />
            </div>
            <h3 className="text-xl font-bold text-white">
              {isToday ? "Start a Conversation" : `No chats on ${formatDate(selectedDate)}`}
            </h3>
            <p className="text-sm text-gray-400 text-center max-w-[360px] leading-relaxed">
              {isToday
                ? "Ask me anything about your health — nutrition, exercise, skin care, sleep tips, and more!"
                : "Select today's date to start a new conversation."}
            </p>
            {isToday && (
              <div className="flex flex-wrap gap-2 justify-center mt-2">
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
                    className="px-3.5 py-2 rounded-full border border-white/10 bg-[#1a1f2e] text-gray-300 text-xs font-medium hover:bg-blue-600 hover:text-white hover:border-blue-500 transition-all"
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
              className={`flex gap-3 items-start ${msg.role === "user" ? "flex-row-reverse pl-10" : "flex-row pr-10"
                }`}
            >
              {/* Avatar */}
              <div
                className={`w-[34px] h-[34px] min-w-[34px] rounded-xl flex items-center justify-center text-white shadow-md ${
                  msg.role === "user"
                    ? "bg-blue-600"
                    : "bg-blue-600"
                }`}
              >
                {msg.role === "user" ? <UserIcon /> : <BotIcon />}
              </div>

              {/* Bubble */}
              <div
                className={`px-4 py-3 text-sm leading-relaxed max-w-full break-words ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-[14px] rounded-br-[4px]"
                    : "bg-[#1a1f2e] text-gray-200 rounded-[14px] rounded-bl-[4px] border border-white/10"
                }`}
              >
                {/* Formatted content with bullet points */}
                <div className="whitespace-pre-wrap">
                  {msg.streaming && !msg.content ? (
                    <div className="flex gap-1 py-1">
                      <span className="w-2 h-2 rounded-full bg-blue-400" />
                      <span className="w-2 h-2 rounded-full bg-blue-400" />
                      <span className="w-2 h-2 rounded-full bg-blue-400" />
                    </div>
                  ) : (
                    formatMessageContent(msg.content)
                  )}
                </div>

                {/* Time */}
                {msg.createdAt && (
                  <div
                    className={`mt-2 text-[10px] opacity-50 ${msg.role === "user" ? "text-right" : "text-left"
                      }`}
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
        className={`flex items-center gap-2.5 px-4 py-3 bg-[#1a1f2e]/95 backdrop-blur-sm rounded-2xl border border-white/10 mt-2 transition-all focus-within:border-blue-500/50 ${
          !isToday ? "opacity-50 pointer-events-none" : ""
        }`}
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
          className="flex-1 border-none outline-none text-sm text-white bg-transparent font-medium placeholder:text-gray-500 disabled:cursor-not-allowed"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isStreaming || !isToday}
          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
            input.trim() && !isStreaming
              ? "bg-blue-600 text-white hover:bg-blue-500 cursor-pointer"
              : "bg-[#2a3040] text-gray-500 cursor-not-allowed"
          }`}
        >
          {isStreaming ? (
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
            </div>
          ) : (
            <SendIcon />
          )}
        </button>
      </div>
    </div>
  );
}