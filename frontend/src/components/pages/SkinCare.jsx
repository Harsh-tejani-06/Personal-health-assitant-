import { useState, useEffect } from "react";
import { getSkinCarePlan, generateSkinCarePlan, logSkinCareTask, getSkinCareLog, getSkinCareCalendar } from "../../services/skinCareService";

// ============================================================
// PRODUCT OPTIONS
// ============================================================
const PRODUCT_OPTIONS = {
  allopathic: [
    { name: "Gentle Foam Cleanser", category: "cleanser" },
    { name: "Salicylic Acid Face Wash", category: "cleanser" },
    { name: "Glycolic Acid Cleanser", category: "cleanser" },
    { name: "Hyaluronic Acid Serum", category: "serum" },
    { name: "Niacinamide Serum", category: "serum" },
    { name: "Vitamin C Serum", category: "serum" },
    { name: "Retinol Serum", category: "serum" },
    { name: "Benzoyl Peroxide Gel", category: "treatment" },
    { name: "AHA/BHA Exfoliant", category: "exfoliant" },
    { name: "Ceramide Moisturizer", category: "moisturizer" },
    { name: "Oil-Free Moisturizer", category: "moisturizer" },
    { name: "SPF 50 Sunscreen", category: "sunscreen" },
    { name: "SPF 30 Sunscreen", category: "sunscreen" },
    { name: "Micellar Water", category: "cleanser" },
    { name: "Eye Cream", category: "treatment" },
    { name: "Sheet Mask (Hydrating)", category: "mask" },
    { name: "Clay Mask", category: "mask" },
    { name: "Lip Balm SPF", category: "lip care" },
  ],
  homeopathic: [
    { name: "Aloe Vera Gel", category: "moisturizer" },
    { name: "Rose Water Toner", category: "toner" },
    { name: "Neem Face Wash", category: "cleanser" },
    { name: "Turmeric Face Pack", category: "mask" },
    { name: "Tea Tree Oil", category: "treatment" },
    { name: "Coconut Oil", category: "moisturizer" },
    { name: "Sandalwood Paste", category: "mask" },
    { name: "Multani Mitti (Fuller's Earth)", category: "mask" },
    { name: "Kumkumadi Oil", category: "serum" },
    { name: "Saffron Cream", category: "moisturizer" },
    { name: "Honey & Lemon Pack", category: "mask" },
    { name: "Cucumber Toner", category: "toner" },
    { name: "Castor Oil", category: "treatment" },
    { name: "Shea Butter", category: "moisturizer" },
    { name: "Witch Hazel Toner", category: "toner" },
  ]
};

const CATEGORY_EMOJIS = { cleanser: "🧴", serum: "💧", moisturizer: "🧊", sunscreen: "☀️", treatment: "💊", exfoliant: "✨", toner: "🌹", mask: "🎭", "lip care": "💋" };

function getTodayDate() { return new Date().toISOString().split("T")[0]; }

function formatDateShort(d) {
  const date = new Date(d + "T00:00:00");
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function SkinCare() {
  const [view, setView] = useState("loading"); // loading | onboarding | routine | calendar
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [customProduct, setCustomProduct] = useState("");
  const [customType, setCustomType] = useState("allopathic");
  const [customCategory, setCustomCategory] = useState("treatment");
  const [plan, setPlan] = useState(null);
  const [generating, setGenerating] = useState(false);

  // Routine state
  const [routineDate, setRoutineDate] = useState(getTodayDate());
  const [morningChecks, setMorningChecks] = useState([]);
  const [nightChecks, setNightChecks] = useState([]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // Calendar state
  const [calendarLogs, setCalendarLogs] = useState([]);
  const [calendarMeta, setCalendarMeta] = useState(null);
  const [calendarMonth, setCalendarMonth] = useState(() => { const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() }; });
  const [selectedCalDay, setSelectedCalDay] = useState(null);
  const [calDayLog, setCalDayLog] = useState(null);
  const [calDayMorning, setCalDayMorning] = useState([]);
  const [calDayNight, setCalDayNight] = useState([]);
  const [calDaySaving, setCalDaySaving] = useState(false);

  // ---- Load initial data ----
  useEffect(() => { loadPlan(); }, []);

  async function loadPlan() {
    try {
      const data = await getSkinCarePlan();
      if (data.exists) {
        setProducts(data.products);
        setPlan(data.plan);
        await loadDayLog(getTodayDate(), data.plan);
        setView("routine");
      } else {
        setView("onboarding");
      }
    } catch { setView("onboarding"); }
  }

  async function loadDayLog(date, planData) {
    const p = planData || plan;
    try {
      const log = await getSkinCareLog(date);
      const mc = log.morningCompleted?.length ? log.morningCompleted : new Array(p?.morning?.length || 0).fill(false);
      const nc = log.nightCompleted?.length ? log.nightCompleted : new Array(p?.night?.length || 0).fill(false);
      setMorningChecks(mc);
      setNightChecks(nc);
      setRoutineDate(date);
    } catch {
      setMorningChecks(new Array(p?.morning?.length || 0).fill(false));
      setNightChecks(new Array(p?.night?.length || 0).fill(false));
      setRoutineDate(date);
    }
  }

  // ---- Product selection ----
  function toggleProduct(product, type) {
    const key = `${type}:${product.name}`;
    setSelectedProducts(prev => {
      const exists = prev.find(p => `${p.type}:${p.name}` === key);
      if (exists) return prev.filter(p => `${p.type}:${p.name}` !== key);
      return [...prev, { ...product, type }];
    });
  }

  function isSelected(name, type) {
    return selectedProducts.some(p => p.name === name && p.type === type);
  }

  function addCustomProduct() {
    if (!customProduct.trim()) return;
    const p = { name: customProduct.trim(), type: customType, category: customCategory };
    setSelectedProducts(prev => [...prev, p]);
    setCustomProduct("");
  }

  async function handleGenerate() {
    if (selectedProducts.length === 0) return;
    setGenerating(true);
    try {
      const data = await generateSkinCarePlan(selectedProducts);
      if (data.success) {
        setProducts(data.products);
        setPlan(data.plan);
        const mc = new Array(data.plan.morning?.length || 0).fill(false);
        const nc = new Array(data.plan.night?.length || 0).fill(false);
        setMorningChecks(mc);
        setNightChecks(nc);
        setRoutineDate(getTodayDate());
        setView("routine");
        showToast("✨ Your skincare plan is ready!");
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to generate plan. Try again.";
      showToast(msg);
    } finally { setGenerating(false); }
  }

  // ---- Daily logging ----
  async function handleCheck(period, index) {
    const newMorning = [...morningChecks];
    const newNight = [...nightChecks];
    if (period === "morning") newMorning[index] = !newMorning[index];
    else newNight[index] = !newNight[index];
    setMorningChecks(newMorning);
    setNightChecks(newNight);

    setSaving(true);
    try {
      await logSkinCareTask(routineDate, newMorning, newNight);
    } catch { showToast("Failed to save"); }
    finally { setSaving(false); }
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 2500); }

  // ---- Calendar ----
  async function openCalendar() {
    setView("calendar");
    try {
      const data = await getSkinCareCalendar();
      setCalendarLogs(data.logs || []);
      setCalendarMeta(data.plan);
    } catch { setCalendarLogs([]); }
  }

  function getLogForDate(date) { return calendarLogs.find(l => l.date === date); }

  function getDayStatus(date) {
    const log = getLogForDate(date);
    if (!log) return "none";
    const allM = log.morningCompleted || [];
    const allN = log.nightCompleted || [];
    const total = allM.length + allN.length;
    if (total === 0) return "none";
    const done = allM.filter(Boolean).length + allN.filter(Boolean).length;
    if (done === total) return "complete";
    if (done > 0) return "partial";
    return "none";
  }

  async function selectCalendarDay(dateStr) {
    setSelectedCalDay(dateStr);
    try {
      const log = await getSkinCareLog(dateStr);
      setCalDayLog(log);
      setCalDayMorning(log.morningCompleted?.length ? [...log.morningCompleted] : new Array(plan?.morning?.length || 0).fill(false));
      setCalDayNight(log.nightCompleted?.length ? [...log.nightCompleted] : new Array(plan?.night?.length || 0).fill(false));
    } catch {
      setCalDayMorning(new Array(plan?.morning?.length || 0).fill(false));
      setCalDayNight(new Array(plan?.night?.length || 0).fill(false));
    }
  }

  async function handleCalDayCheck(period, index) {
    const newM = [...calDayMorning];
    const newN = [...calDayNight];
    if (period === "morning") newM[index] = !newM[index];
    else newN[index] = !newN[index];
    setCalDayMorning(newM);
    setCalDayNight(newN);

    setCalDaySaving(true);
    try {
      await logSkinCareTask(selectedCalDay, newM, newN);
      // Update calendar logs locally
      setCalendarLogs(prev => {
        const idx = prev.findIndex(l => l.date === selectedCalDay);
        const entry = { date: selectedCalDay, morningCompleted: newM, nightCompleted: newN, notes: "" };
        if (idx >= 0) { const copy = [...prev]; copy[idx] = entry; return copy; }
        return [...prev, entry];
      });
    } catch { showToast("Failed to save"); }
    finally { setCalDaySaving(false); }
  }

  // Day nav for routine view
  function goToDay(offset) {
    const d = new Date(routineDate + "T00:00:00");
    d.setDate(d.getDate() + offset);
    const newDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (newDate > getTodayDate()) return;
    loadDayLog(newDate);
  }

  function goEditProducts() {
    setSelectedProducts(products.map(p => ({ ...p })));
    setView("onboarding");
  }

  // Calendar grid
  function getCalendarDays() {
    const { year, month } = calendarMonth;
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      days.push(dateStr);
    }
    return days;
  }

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const mornDone = morningChecks.filter(Boolean).length;
  const nightDone = nightChecks.filter(Boolean).length;
  const totalSteps = (plan?.morning?.length || 0) + (plan?.night?.length || 0);
  const totalDone = mornDone + nightDone;
  const progress = totalSteps > 0 ? Math.round((totalDone / totalSteps) * 100) : 0;

  // ============================================================
  // RENDER: LOADING
  // ============================================================
  if (view === "loading") return (
    <div className="flex flex-col items-center justify-center py-32">
      <div className="w-10 h-10 border-[3px] border-pink-200 dark:border-pink-800 border-t-pink-500 rounded-full animate-spin mb-4" />
      <p className="text-sm font-medium text-slate-400 dark:text-slate-500">Loading your skincare plan...</p>
    </div>
  );

  // ============================================================
  // RENDER: ONBOARDING
  // ============================================================
  if (view === "onboarding") return (
    <div className="max-w-4xl mx-auto pb-20">
      {toast && <div className="fixed top-24 right-6 z-50 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-2xl rounded-2xl px-5 py-3 flex items-center gap-2 animate-bounce"><span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{toast}</span></div>}

      {/* Header */}
      <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-fuchsia-500 rounded-3xl p-8 mb-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl">✨</div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">Set Up Your Skincare Routine</h1>
              <p className="text-white/80 text-sm font-medium mt-1">Select the products you currently use and our AI will build your personalized daily plan</p>
            </div>
          </div>
          {selectedProducts.length > 0 && (
            <div className="mt-4 flex items-center gap-2">
              <span className="bg-white/20 backdrop-blur-md text-sm font-bold px-4 py-1.5 rounded-xl">{selectedProducts.length} products selected</span>
            </div>
          )}
        </div>
      </div>

      {/* Product Categories */}
      {[{ key: "allopathic", label: "Allopathic / Clinical Products", emoji: "💊", gradient: "from-blue-500 to-cyan-500", bg: "bg-blue-50 dark:bg-blue-950/20", border: "border-blue-200 dark:border-blue-800", selectedBg: "bg-blue-100 dark:bg-blue-900/40", ring: "ring-blue-400" },
      { key: "homeopathic", label: "Homeopathic / Natural Products", emoji: "🌿", gradient: "from-emerald-500 to-green-500", bg: "bg-emerald-50 dark:bg-emerald-950/20", border: "border-emerald-200 dark:border-emerald-800", selectedBg: "bg-emerald-100 dark:bg-emerald-900/40", ring: "ring-emerald-400" }
      ].map(cat => (
        <div key={cat.key} className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 bg-gradient-to-br ${cat.gradient} rounded-xl flex items-center justify-center text-xl text-white shadow-lg`}>{cat.emoji}</div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">{cat.label}</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {PRODUCT_OPTIONS[cat.key].map(prod => {
              const sel = isSelected(prod.name, cat.key);
              return (
                <button key={prod.name} onClick={() => toggleProduct(prod, cat.key)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${sel
                    ? `${cat.selectedBg} ${cat.border} ring-2 ${cat.ring} ring-offset-2 dark:ring-offset-slate-900 scale-[1.02]`
                    : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md"}`}>
                  <div className="flex items-start gap-2">
                    <span className="text-lg mt-0.5">{CATEGORY_EMOJIS[prod.category] || "🧴"}</span>
                    <div className="min-w-0">
                      <p className={`text-sm font-bold truncate ${sel ? "text-slate-800 dark:text-white" : "text-slate-700 dark:text-slate-300"}`}>{prod.name}</p>
                      <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 mt-0.5">{prod.category}</p>
                    </div>
                  </div>
                  {sel && <div className="mt-2 text-right"><span className="text-xs font-bold text-emerald-500">✓ Selected</span></div>}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Add Custom Product */}
      <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 mb-8">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <span className="text-lg">➕</span> Add Custom Product
        </h3>
        <div className="flex flex-wrap gap-3">
          <input value={customProduct} onChange={e => setCustomProduct(e.target.value)} placeholder="Product name..." className="flex-1 min-w-[200px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-pink-400" />
          <select value={customType} onChange={e => setCustomType(e.target.value)} className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-medium text-slate-700 dark:text-slate-300">
            <option value="allopathic">Allopathic</option>
            <option value="homeopathic">Homeopathic</option>
          </select>
          <select value={customCategory} onChange={e => setCustomCategory(e.target.value)} className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-medium text-slate-700 dark:text-slate-300">
            {Object.keys(CATEGORY_EMOJIS).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={addCustomProduct} className="px-5 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold rounded-xl text-sm hover:shadow-lg transition-all active:scale-95">Add</button>
        </div>
      </div>

      {/* Selected Products Summary */}
      {selectedProducts.length > 0 && (
        <div className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20 rounded-2xl border border-pink-200 dark:border-pink-800 p-6 mb-8">
          <h3 className="text-sm font-bold text-pink-700 dark:text-pink-300 mb-3">Selected Products ({selectedProducts.length})</h3>
          <div className="flex flex-wrap gap-2">
            {selectedProducts.map((p, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-xl border border-pink-200 dark:border-pink-800">
                {CATEGORY_EMOJIS[p.category] || "🧴"} {p.name}
                <button onClick={() => setSelectedProducts(prev => prev.filter((_, j) => j !== i))} className="ml-1 text-red-400 hover:text-red-600 font-bold">×</button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Generate Button */}
      <button onClick={handleGenerate} disabled={selectedProducts.length === 0 || generating}
        className={`w-full py-4 rounded-2xl font-bold text-lg transition-all cursor-pointer ${selectedProducts.length === 0 || generating
          ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed"
          : "bg-gradient-to-r from-pink-500 via-rose-500 to-fuchsia-500 text-white shadow-xl shadow-pink-200 dark:shadow-pink-900/30 hover:shadow-2xl hover:scale-[1.01] active:scale-[0.99]"}`}>
        {generating ? (<span className="flex items-center justify-center gap-3"><span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />AI is generating your plan...</span>) : `✨ Generate My Skincare Plan (${selectedProducts.length} products)`}
      </button>
    </div>
  );

  // ============================================================
  // RENDER: CALENDAR VIEW
  // ============================================================
  if (view === "calendar") {
    const calDays = getCalendarDays();
    const today = getTodayDate();
    return (
      <div className="max-w-4xl mx-auto pb-4">
        {toast && <div className="fixed top-24 right-6 z-50 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-2xl rounded-2xl px-5 py-3 flex items-center gap-2 animate-bounce"><span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{toast}</span></div>}

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => { setSelectedCalDay(null); setView("routine"); }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-pink-50 dark:hover:bg-pink-900/20 hover:text-pink-500 transition-all">
            ← Back to Routine
          </button>
          <h1 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">📅 Calendar View</h1>
        </div>

        {/* Month Navigation + Calendar */}
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setCalendarMonth(p => { let m = p.month - 1, y = p.year; if (m < 0) { m = 11; y--; } return { year: y, month: m }; })}
              className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-pink-100 dark:hover:bg-pink-900/30 hover:text-pink-500 transition-all font-bold px-0">‹</button>
            <h2 className="text-lg font-black text-slate-800 dark:text-white">{monthNames[calendarMonth.month]} {calendarMonth.year}</h2>
            <button onClick={() => setCalendarMonth(p => { let m = p.month + 1, y = p.year; if (m > 11) { m = 0; y++; } return { year: y, month: m }; })}
              className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-pink-100 dark:hover:bg-pink-900/30 hover:text-pink-500 transition-all font-bold px-0">›</button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
              <div key={d} className="text-center text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-2">
            {calDays.map((dateStr, i) => {
              if (!dateStr) return <div key={`e-${i}`} />;
              const dayNum = parseInt(dateStr.split("-")[2]);
              const status = getDayStatus(dateStr);
              const isToday = dateStr === today;
              const isFuture = dateStr > today;
              const isSelected = selectedCalDay === dateStr;
              return (
                <button key={dateStr} disabled={isFuture}
                  onClick={() => !isFuture && selectCalendarDay(dateStr)}
                  className={`py-2.5 sm:py-3 rounded-xl flex flex-col items-center justify-center text-sm font-bold transition-all px-0
                                        ${isFuture ? "opacity-30 cursor-not-allowed" : "hover:scale-105 cursor-pointer"}
                                        ${isSelected ? "ring-2 ring-pink-400 ring-offset-2 dark:ring-offset-slate-800" : ""}
                                        ${isToday ? "border-2 border-pink-400 dark:border-pink-500" : "border border-slate-100 dark:border-slate-700"}
                                        ${status === "complete" ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300" :
                      status === "partial" ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300" :
                        "bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400"}`}>
                  <span>{dayNum}</span>
                  <span className="text-[9px] mt-0.5 leading-none">
                    {status === "complete" ? "✅" : status === "partial" ? "🟡" : isFuture ? "" : "—"}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
            <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">✅ Complete</span>
            <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">🟡 Partial</span>
            <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">— Not done</span>
          </div>
        </div>

        {/* Selected Day Detail — Modal Overlay */}
        {selectedCalDay && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setSelectedCalDay(null)}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden w-[90%] max-w-lg max-h-[80vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-base">{selectedCalDay === today ? "Today" : formatDateShort(selectedCalDay)}</h3>
                    <p className="text-white/80 text-[11px] font-medium">{selectedCalDay} • Click checkboxes to update</p>
                  </div>
                  <button onClick={() => setSelectedCalDay(null)} className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-all px-0 text-sm">✕</button>
                </div>
              </div>
              <div className="p-4 space-y-3">
                {[{ label: "Morning Routine ☀️", steps: plan?.morning || [], checks: calDayMorning, period: "morning" },
                { label: "Night Routine 🌙", steps: plan?.night || [], checks: calDayNight, period: "night" }
                ].map(section => (
                  <div key={section.period}>
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{section.label}</h4>
                    {section.steps.map((step, i) => (
                      <label key={i} className={`flex items-center gap-2 p-2.5 rounded-xl mb-1 cursor-pointer transition-all ${section.checks[i] ? "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800" : "bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/50"}`}>
                        <input type="checkbox" checked={section.checks[i] || false}
                          onChange={() => handleCalDayCheck(section.period, i)}
                          className="w-4 h-4 rounded accent-pink-500 cursor-pointer" />
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-semibold ${section.checks[i] ? "text-emerald-700 dark:text-emerald-300 line-through" : "text-slate-700 dark:text-slate-300"}`}>{step.product}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{step.instruction}</p>
                        </div>
                        {step.duration && <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded-md shrink-0">{step.duration}</span>}
                      </label>
                    ))}
                  </div>
                ))}
                {calDaySaving && <p className="text-center text-xs text-pink-500 font-medium animate-pulse">Saving...</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============================================================
  // RENDER: DAILY ROUTINE VIEW
  // ============================================================
  return (
    <div className="max-w-4xl mx-auto pb-20">
      {toast && <div className="fixed top-24 right-6 z-50 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-2xl rounded-2xl px-5 py-3 flex items-center gap-2 animate-bounce"><span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{toast}</span></div>}

      {/* Header */}
      <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-fuchsia-500 rounded-3xl p-6 mb-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl">✨</div>
              <div>
                <h1 className="text-xl font-black tracking-tight">My Skincare Routine</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-white/80 text-xs font-medium">{routineDate === getTodayDate() ? "Today" : formatDateShort(routineDate)}</span>
                  <span className="w-1 h-1 bg-white/40 rounded-full" />
                  <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-lg">Follow for {plan?.followFor || "—"}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => goToDay(-1)} className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition-all px-0 font-bold">‹</button>
              <button onClick={() => goToDay(1)} disabled={routineDate >= getTodayDate()} className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition-all px-0 font-bold disabled:opacity-30 disabled:cursor-not-allowed">›</button>
              <button onClick={openCalendar} className="px-4 py-2 bg-white/20 rounded-xl text-xs font-bold hover:bg-white/30 transition-all">📅 Calendar</button>
              <button onClick={goEditProducts} className="px-4 py-2 bg-white/20 rounded-xl text-xs font-bold hover:bg-white/30 transition-all">🔄 Update Products</button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-5">
            <div className="flex justify-between text-xs font-bold text-white/80 mb-1.5">
              <span>{totalDone}/{totalSteps} steps done</span>
              <span>{progress}%</span>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all duration-700 ease-out" style={{ width: `${progress}%` }} />
            </div>
            {progress === 100 && <p className="text-xs text-white/90 font-bold mt-2 text-center">🎉 All steps completed for {routineDate === getTodayDate() ? "today" : "this day"}!</p>}
          </div>
        </div>
      </div>

      {/* Routine Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {[{ label: "Morning Routine", emoji: "☀️", gradient: "from-amber-400 to-orange-500", steps: plan?.morning || [], checks: morningChecks, period: "morning", border: "border-amber-200 dark:border-amber-800", bg: "bg-amber-50 dark:bg-amber-950/20" },
        { label: "Night Routine", emoji: "🌙", gradient: "from-indigo-400 to-purple-500", steps: plan?.night || [], checks: nightChecks, period: "night", border: "border-indigo-200 dark:border-indigo-800", bg: "bg-indigo-50 dark:bg-indigo-950/20" }
        ].map(r => {
          const done = r.checks.filter(Boolean).length;
          return (
            <div key={r.period} className={`bg-white dark:bg-slate-800/80 rounded-2xl border-2 ${r.border} overflow-hidden shadow-sm`}>
              <div className={`bg-gradient-to-r ${r.gradient} p-5 text-white relative overflow-hidden`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl pointer-events-none" />
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{r.emoji}</span>
                    <div>
                      <h3 className="font-bold text-lg">{r.label}</h3>
                      <p className="text-white/80 text-xs font-medium">{done}/{r.steps.length} completed</p>
                    </div>
                  </div>
                  {done === r.steps.length && r.steps.length > 0 && <span className="text-2xl">✅</span>}
                </div>
              </div>
              <div className={`p-4 ${r.bg}`}>
                {r.steps.length === 0 ? (
                  <p className="text-center text-sm text-slate-400 dark:text-slate-500 py-6">No steps in this routine</p>
                ) : (
                  <div className="space-y-2">
                    {r.steps.map((step, i) => (
                      <label key={i} className={`flex items-center gap-3 p-3.5 rounded-xl cursor-pointer transition-all ${r.checks[i]
                        ? "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800"
                        : "bg-white dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 hover:shadow-md"}`}>
                        <input type="checkbox" checked={r.checks[i] || false} onChange={() => handleCheck(r.period, i)}
                          className="w-5 h-5 rounded-md accent-pink-500 cursor-pointer shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 w-6 h-6 rounded-lg flex items-center justify-center shrink-0">{step.step}</span>
                            <p className={`text-sm font-bold ${r.checks[i] ? "text-emerald-700 dark:text-emerald-300 line-through" : "text-slate-700 dark:text-slate-300"}`}>{step.product}</p>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 ml-8">{step.instruction}</p>
                        </div>
                        {step.duration && <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-lg shrink-0">{step.duration}</span>}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tips Section */}
      {plan?.tips?.length > 0 && (
        <div className="bg-gradient-to-br from-pink-50 to-fuchsia-50 dark:from-pink-950/20 dark:to-fuchsia-950/20 rounded-2xl border border-pink-200 dark:border-pink-800 p-6">
          <h3 className="font-bold text-pink-700 dark:text-pink-300 mb-4 flex items-center gap-2 text-sm">
            <span className="text-lg">💡</span> Personalized Tips from AI
          </h3>
          <ul className="space-y-2.5">
            {plan.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300 font-medium">
                <span className="w-6 h-6 bg-pink-100 dark:bg-pink-900/40 rounded-lg flex items-center justify-center text-xs font-black text-pink-500 shrink-0 mt-0.5">{i + 1}</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {saving && <p className="text-center text-xs text-pink-500 font-medium mt-4 animate-pulse">Saving...</p>}
    </div>
  );
}
