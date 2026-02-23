import { useState, useEffect, useRef, useMemo } from "react";
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

const SidebarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M9 3v18" />
  </svg>
);

const PlusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" d="M12 5v14M5 12h14" />
  </svg>
);

const SparkleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" />
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

// -------- Markdown Parser --------
function parseMarkdown(text) {
  if (!text) return null;

  const lines = text.split("\n");
  const elements = [];
  let currentList = null;
  let currentListType = null;
  let listKey = 0;

  function flushList() {
    if (currentList && currentList.length > 0) {
      const Tag = currentListType === "ol" ? "ol" : "ul";
      const listClass = currentListType === "ol"
        ? "list-decimal list-inside space-y-1.5 my-2 ml-1"
        : "list-none space-y-1.5 my-2 ml-1";
      elements.push(
        <Tag key={`list-${listKey++}`} className={listClass}>
          {currentList}
        </Tag>
      );
      currentList = null;
      currentListType = null;
    }
  }

  function formatInline(str) {
    const parts = [];
    let remaining = str;
    let partIndex = 0;

    // Process bold (**text**)
    while (remaining.length > 0) {
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      if (boldMatch) {
        const before = remaining.slice(0, boldMatch.index);
        if (before) parts.push(<span key={partIndex++}>{before}</span>);
        parts.push(<strong key={partIndex++} className="font-semibold text-slate-800 dark:text-white">{boldMatch[1]}</strong>);
        remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
      } else {
        // process italic (*text*)
        const italicMatch = remaining.match(/\*(.+?)\*/);
        if (italicMatch) {
          const before = remaining.slice(0, italicMatch.index);
          if (before) parts.push(<span key={partIndex++}>{before}</span>);
          parts.push(<em key={partIndex++} className="italic">{italicMatch[1]}</em>);
          remaining = remaining.slice(italicMatch.index + italicMatch[0].length);
        } else {
          // process inline code (`text`)
          const codeMatch = remaining.match(/`(.+?)`/);
          if (codeMatch) {
            const before = remaining.slice(0, codeMatch.index);
            if (before) parts.push(<span key={partIndex++}>{before}</span>);
            parts.push(
              <code key={partIndex++} className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 text-[13px] font-mono">
                {codeMatch[1]}
              </code>
            );
            remaining = remaining.slice(codeMatch.index + codeMatch[0].length);
          } else {
            parts.push(<span key={partIndex++}>{remaining}</span>);
            remaining = "";
          }
        }
      }
    }

    return parts.length > 0 ? parts : str;
  }

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // Empty line
    if (!trimmed) {
      flushList();
      elements.push(<div key={`br-${idx}`} className="h-2" />);
      return;
    }

    // Headers (### Header)
    const h3Match = trimmed.match(/^###\s+(.*)/);
    if (h3Match) {
      flushList();
      elements.push(
        <h4 key={`h3-${idx}`} className="text-sm font-bold text-slate-800 dark:text-white mt-3 mb-1 flex items-center gap-1.5">
          <span className="w-1 h-4 rounded-full bg-gradient-to-b from-indigo-400 to-purple-500 inline-block" />
          {formatInline(h3Match[1])}
        </h4>
      );
      return;
    }

    const h2Match = trimmed.match(/^##\s+(.*)/);
    if (h2Match) {
      flushList();
      elements.push(
        <h3 key={`h2-${idx}`} className="text-base font-bold text-slate-800 dark:text-white mt-3 mb-1.5 flex items-center gap-2">
          <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-indigo-400 to-purple-500 inline-block" />
          {formatInline(h2Match[1])}
        </h3>
      );
      return;
    }

    const h1Match = trimmed.match(/^#\s+(.*)/);
    if (h1Match) {
      flushList();
      elements.push(
        <h2 key={`h1-${idx}`} className="text-lg font-bold text-slate-800 dark:text-white mt-3 mb-2">
          {formatInline(h1Match[1])}
        </h2>
      );
      return;
    }

    // Unordered list items (- item, * item, • item)
    const ulMatch = trimmed.match(/^[-*•]\s+(.*)/);
    if (ulMatch) {
      if (currentListType !== "ul") flushList();
      if (!currentList) { currentList = []; currentListType = "ul"; }
      currentList.push(
        <li key={`li-${idx}`} className="flex items-start gap-2 text-sm leading-relaxed">
          <span className="mt-2 w-1.5 h-1.5 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex-shrink-0" />
          <span className="flex-1">{formatInline(ulMatch[1])}</span>
        </li>
      );
      return;
    }

    // Ordered list items (1. item, 2. item)
    const olMatch = trimmed.match(/^(\d+)[.)]\s+(.*)/);
    if (olMatch) {
      if (currentListType !== "ol") flushList();
      if (!currentList) { currentList = []; currentListType = "ol"; }
      currentList.push(
        <li key={`li-${idx}`} className="flex items-start gap-2.5 text-sm leading-relaxed">
          <span className="mt-0.5 w-5 h-5 rounded-full bg-gradient-to-br from-indigo-400/20 to-purple-500/20 dark:from-indigo-400/30 dark:to-purple-500/30 text-indigo-600 dark:text-indigo-300 flex items-center justify-center text-[11px] font-bold flex-shrink-0">
            {olMatch[1]}
          </span>
          <span className="flex-1">{formatInline(olMatch[2])}</span>
        </li>
      );
      return;
    }

    // Regular paragraph
    flushList();
    elements.push(
      <p key={`p-${idx}`} className="text-sm leading-relaxed">
        {formatInline(trimmed)}
      </p>
    );
  });

  flushList();
  return elements;
}

// -------- Typing indicator dots --------
function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 py-2 px-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400"
          style={{
            animation: `typingBounce 1.4s ease-in-out ${i * 0.16}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

// -------- Chat Message Bubble --------
function MessageBubble({ msg }) {
  const isUser = msg.role === "user";
  const parsed = useMemo(() => {
    if (isUser) return null;
    return parseMarkdown(msg.content);
  }, [msg.content, isUser]);

  return (
    <div className={`flex gap-3 items-start message-appear ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div
        className={`w-8 h-8 min-w-[32px] rounded-xl flex items-center justify-center text-white shadow-lg flex-shrink-0 ${isUser
          ? "bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/20"
          : "bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/20"
          }`}
      >
        {isUser ? <UserIcon /> : <BotIcon />}
      </div>

      {/* Bubble */}
      <div className={`max-w-[80%] min-w-0 ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`px-4 py-3 break-words ${isUser
            ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl rounded-tr-md shadow-lg shadow-blue-500/15"
            : "bg-white dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 rounded-2xl rounded-tl-md border border-slate-200/80 dark:border-slate-700/60 shadow-lg shadow-black/[0.03] dark:shadow-black/20"
            }`}
        >
          {isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
          ) : msg.content ? (
            <div className="ai-content space-y-1">{parsed}</div>
          ) : msg.streaming ? (
            <TypingDots />
          ) : (
            <p className="text-sm text-slate-400 italic">No response</p>
          )}
        </div>

        {/* Time */}
        {msg.createdAt && (
          <p className={`mt-1 text-[10px] font-medium text-slate-400/70 dark:text-slate-500/70 ${isUser ? "text-right mr-1" : "text-left ml-1"}`}>
            {formatTime(msg.createdAt)}
          </p>
        )}
      </div>
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
          } catch {
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

  // Group dates into sections
  const groupedDates = useMemo(() => {
    const today = getTodayDate();
    const todayObj = new Date();
    const groups = { today: [], yesterday: [], thisWeek: [], older: [] };

    dates.forEach((d) => {
      const diff = Math.floor((todayObj - new Date(d + "T00:00:00")) / (1000 * 60 * 60 * 24));
      if (d === today) groups.today.push(d);
      else if (diff === 1) groups.yesterday.push(d);
      else if (diff <= 7) groups.thisWeek.push(d);
      else groups.older.push(d);
    });

    return groups;
  }, [dates]);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-[#0c1222] dark:via-[#0f172a] dark:to-[#131c33]">

      {/* ============ LEFT SIDEBAR — CHAT HISTORY ============ */}
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full z-50 w-72 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-r border-slate-200/60 dark:border-slate-700/60 shadow-2xl transition-transform duration-300 ease-out flex flex-col
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
                <BotIcon />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Chat History</h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{dates.length} conversations</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          </div>


        </div>

        {/* Date List */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 custom-scrollbar">
          {[
            { label: "Today", items: groupedDates.today },
            { label: "Yesterday", items: groupedDates.yesterday },
            { label: "This Week", items: groupedDates.thisWeek },
            { label: "Older", items: groupedDates.older },
          ].map(
            (group) =>
              group.items.length > 0 && (
                <div key={group.label}>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 px-2">
                    {group.label}
                  </p>
                  <div className="space-y-0.5">
                    {group.items.map((d) => (
                      <button
                        key={d}
                        onClick={() => {
                          setSelectedDate(d);
                          setSidebarOpen(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${d === selectedDate
                          ? "bg-gradient-to-r from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-500/30"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                          }`}
                      >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${d === selectedDate
                          ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 group-hover:text-indigo-500"
                          }`}>
                          <CalendarIcon />
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <p className="truncate">{formatDate(d)}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">{d}</p>
                        </div>
                        {d === selectedDate && (
                          <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )
          )}

          {dates.length === 0 && (
            <div className="py-10 text-center">
              <p className="text-slate-400 dark:text-slate-500 text-sm">No conversations yet</p>
              <p className="text-slate-300 dark:text-slate-600 text-xs mt-1">Start a new chat below</p>
            </div>
          )}
        </div>
      </aside>

      {/* ============ MAIN CHAT AREA ============ */}
      <div className="flex flex-col h-full w-full">

        {/* ---- HEADER ---- */}
        <div className="flex-shrink-0 z-20 px-4 pt-4 pb-2">
          <div className="max-w-[860px] mx-auto">
            <div className="flex items-center gap-3 px-4 py-3 bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/40 shadow-sm transition-colors">

              {/* Sidebar toggle */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="w-9 h-9 rounded-xl bg-slate-100/80 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                title="Chat History"
              >
                <SidebarIcon />
              </button>

              {/* Title */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 flex-shrink-0">
                  <BotIcon />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-slate-800 dark:text-white tracking-tight truncate">
                    Health Assistant
                  </h2>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate">
                      {isToday ? "Online • Powered by AI" : `Viewing ${formatDate(selectedDate)}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Date badge */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100/80 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 text-xs font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-500 transition-all"
                >
                  <CalendarIcon />
                  {formatDate(selectedDate)}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ---- MESSAGES ---- */}
        <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
          <div className="max-w-[860px] mx-auto w-full py-4">
            {loading ? (
              <div className="flex items-center justify-center h-[50vh] text-slate-400 dark:text-slate-500 text-sm">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-[3px] border-indigo-400/30 border-t-indigo-500 rounded-full animate-spin" />
                  <span className="font-medium">Loading messages...</span>
                </div>
              </div>
            ) : messages.length === 0 ? (
              /* -------- Empty state -------- */
              <div className="flex flex-col items-center justify-center h-[55vh] gap-5">
                <div className="relative">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-2xl shadow-indigo-500/30">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <path d="M12 2a2 2 0 012 2v1h3a3 3 0 013 3v8a3 3 0 01-3 3H7a3 3 0 01-3-3V8a3 3 0 013-3h3V4a2 2 0 012-2z" />
                      <circle cx="9" cy="11" r="1.5" fill="currentColor" />
                      <circle cx="15" cy="11" r="1.5" fill="currentColor" />
                      <path d="M9 15h6" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg">
                    <SparkleIcon />
                  </div>
                </div>

                <div className="text-center">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1.5">
                    {isToday ? "Hi there! How can I help?" : `No chats on ${formatDate(selectedDate)}`}
                  </h3>
                  <p className="text-sm text-slate-400 dark:text-slate-500 max-w-sm leading-relaxed">
                    {isToday
                      ? "Ask me anything about nutrition, workouts, sleep, skin care, and more."
                      : "Select today's date to start a new conversation."}
                  </p>
                </div>

                {isToday && (
                  <div className="grid grid-cols-2 gap-2 max-w-md w-full mt-2">
                    {[
                      { icon: "💪", text: "Workout for my goals" },
                      { icon: "🥗", text: "Diet suggestions" },
                      { icon: "😴", text: "Sleep improvement" },
                      { icon: "✨", text: "Skin care routine" },
                    ].map((suggestion) => (
                      <button
                        key={suggestion.text}
                        onClick={() => {
                          setInput(`${suggestion.icon} ${suggestion.text}`);
                          inputRef.current?.focus();
                        }}
                        className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-slate-200/80 dark:border-slate-700/60 bg-white/60 dark:bg-slate-800/40 backdrop-blur-sm text-sm font-medium text-slate-600 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-500/40 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-300 transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98] text-left"
                      >
                        <span className="text-lg">{suggestion.icon}</span>
                        <span>{suggestion.text}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* -------- Messages -------- */
              <div className="flex flex-col gap-5">
                {messages.map((msg, i) => (
                  <MessageBubble key={i} msg={msg} />
                ))}
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* ---- INPUT BAR ---- */}
        <div className="flex-shrink-0 z-20 px-4 pb-4 pt-2">
          <div className="max-w-[860px] mx-auto">
            <div
              className={`flex items-center gap-3 px-4 py-3 bg-white/80 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl border transition-all shadow-lg shadow-black/[0.03] dark:shadow-black/20 ${isToday
                ? "border-slate-200/60 dark:border-slate-700/50 focus-within:border-indigo-400/60 focus-within:shadow-indigo-500/10 focus-within:shadow-xl"
                : "border-slate-200/30 dark:border-slate-700/30 opacity-50 pointer-events-none"
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
                className="flex-1 border-none outline-none text-sm text-slate-800 dark:text-slate-100 bg-transparent font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 disabled:cursor-not-allowed"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isStreaming || !isToday}
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 ${input.trim() && !isStreaming
                  ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 hover:scale-105 active:scale-95 cursor-pointer"
                  : "bg-slate-100 dark:bg-slate-700/60 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                  }`}
              >
                {isStreaming ? (
                  <div className="w-5 h-5 border-2 border-indigo-300 border-t-white rounded-full animate-spin" />
                ) : (
                  <SendIcon />
                )}
              </button>
            </div>
            <p className="text-center text-[10px] text-slate-400/60 dark:text-slate-500/60 mt-2 font-medium">
              AI can make mistakes. Please verify important health information.
            </p>
          </div>
        </div>
      </div>

      {/* ============ STYLES ============ */}
      <style>{`
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }

        .message-appear {
          animation: messageSlide 0.3s ease-out both;
        }

        @keyframes messageSlide {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.4);
        }

        .ai-content > p:first-child {
          margin-top: 0;
        }
        .ai-content > p:last-child {
          margin-bottom: 0;
        }
      `}</style>
    </div>
  );
}