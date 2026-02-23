import { useState, useEffect, useMemo } from "react";
import { getDietDates, getDiet, removeFromDiet } from "../../services/dietService";

// -------- Icons --------
const CalendarIcon = () => (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
);

const SidebarIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M9 3v18" />
    </svg>
);

function getTodayDate() {
    return new Date().toISOString().split("T")[0];
}

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

const SLOTS = [
    { key: "morning", label: "Morning", emoji: "🌅", time: "6:00 - 11:00 AM", color: "from-amber-400 to-orange-500", bg: "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30", border: "border-amber-200 dark:border-amber-800", text: "text-amber-700 dark:text-amber-400", iconBg: "bg-amber-100 dark:bg-amber-900/40" },
    { key: "afternoon", label: "Afternoon", emoji: "☀️", time: "12:00 - 4:00 PM", color: "from-sky-400 to-blue-500", bg: "bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30", border: "border-sky-200 dark:border-sky-800", text: "text-sky-700 dark:text-sky-400", iconBg: "bg-sky-100 dark:bg-sky-900/40" },
    { key: "night", label: "Night", emoji: "🌙", time: "6:00 - 9:00 PM", color: "from-indigo-400 to-purple-500", bg: "bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30", border: "border-indigo-200 dark:border-indigo-800", text: "text-indigo-700 dark:text-indigo-400", iconBg: "bg-indigo-100 dark:bg-indigo-900/40" }
];

export default function Diet() {
    const [dates, setDates] = useState([]);
    const [selectedDate, setSelectedDate] = useState(getTodayDate());
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [diet, setDiet] = useState({ morning: [], afternoon: [], night: [] });
    const [loading, setLoading] = useState(true);
    const [deleteMsg, setDeleteMsg] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [selectedRecipe, setSelectedRecipe] = useState(null);

    useEffect(() => { loadDates(); }, []);
    useEffect(() => { loadDiet(selectedDate); }, [selectedDate]);

    async function loadDates() {
        try {
            const data = await getDietDates();
            const allDates = data.dates || [];
            const today = getTodayDate();
            if (!allDates.includes(today)) allDates.unshift(today);
            setDates(allDates);
        } catch (err) {
            console.error("Failed to load diet dates:", err);
        }
    }

    async function loadDiet(date) {
        setLoading(true);
        try {
            const data = await getDiet(date);
            setDiet({
                morning: data.morning || [],
                afternoon: data.afternoon || [],
                night: data.night || []
            });
        } catch (err) {
            console.error("Failed to load diet:", err);
            setDiet({ morning: [], afternoon: [], night: [] });
        } finally {
            setLoading(false);
        }
    }

    async function handleRemove(slot, recipeId) {
        try {
            await removeFromDiet(selectedDate, slot, recipeId);
            setDeleteMsg("Recipe removed successfully!");
            setTimeout(() => setDeleteMsg(null), 2000);
            loadDiet(selectedDate);
        } catch {
            setDeleteMsg("Failed to remove recipe");
            setTimeout(() => setDeleteMsg(null), 2000);
        }
    }

    function openSlotModal(slotKey) {
        setSelectedSlot(SLOTS.find(s => s.key === slotKey));
    }

    function openRecipeModal(recipe) {
        setSelectedRecipe(recipe);
    }

    function closeModals() {
        setSelectedSlot(null);
        setSelectedRecipe(null);
    }

    const totalRecipes = diet.morning.length + diet.afternoon.length + diet.night.length;
    const totalCalories = [...diet.morning, ...diet.afternoon, ...diet.night].reduce((sum, r) => sum + (parseInt(r.calories) || 0), 0);

    // Group dates into sections
    const groupedDates = useMemo(() => {
        const today = getTodayDate();
        const todayObj = new Date();
        const groups = { today: [], yesterday: [], thisWeek: [], older: [] };

        dates.forEach((d) => {
            const dObj = new Date(d + "T00:00:00");
            const diff = Math.floor((todayObj - dObj) / (1000 * 60 * 60 * 24));
            if (d === today) groups.today.push(d);
            else if (diff === 1) groups.yesterday.push(d);
            else if (diff <= 7) groups.thisWeek.push(d);
            else groups.older.push(d);
        });

        return groups;
    }, [dates]);

    return (
        <div className="relative h-screen w-full overflow-hidden bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 dark:from-[#0c1222] dark:via-[#0f172a] dark:to-[#132033]">

            {/* ============ LEFT SIDEBAR — DIET HISTORY ============ */}
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
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25">
                            🥗
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Plan History</h3>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{dates.length} entries</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors px-0"
                    >
                        <span className="text-xl">✕</span>
                    </button>
                </div>

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
                                                    ? "bg-gradient-to-r from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-500/30"
                                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                                                    }`}
                                            >
                                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${d === selectedDate
                                                    ? "bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-md shadow-emerald-500/20"
                                                    : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 group-hover:text-emerald-500"
                                                    }`}>
                                                    <CalendarIcon />
                                                </div>
                                                <div className="flex-1 text-left min-w-0">
                                                    <p className="truncate">{formatDate(d)}</p>
                                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">{d}</p>
                                                </div>
                                                {d === selectedDate && (
                                                    <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )
                    )}
                </div>
            </aside>

            {/* ============ MAIN CONTENT AREA ============ */}
            <div className="flex flex-col h-full w-full overflow-y-auto custom-scrollbar">

                {/* Header Card */}
                <div className="flex-shrink-0 z-20 px-4 pt-4 pb-2">
                    <div className="max-w-6xl mx-auto">
                        <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/40 p-5 shadow-sm transition-colors overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-100/50 to-teal-100/50 dark:from-emerald-900/10 dark:to-teal-900/10 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none" />

                            <div className="relative flex items-center justify-between flex-wrap gap-4">
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => setSidebarOpen(true)}
                                        className="w-10 h-10 rounded-xl bg-slate-100/80 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 flex items-center justify-center transition-all hover:scale-105 active:scale-95 px-0"
                                    >
                                        <SidebarIcon />
                                    </button>

                                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-emerald-200 dark:shadow-emerald-900/30">
                                        <span className="text-2xl">🥗</span>
                                    </div>
                                    <div>
                                        <h1 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">My Diet Plan</h1>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{formatDate(selectedDate)}</span>
                                            <span className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
                                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{totalRecipes} meals</span>
                                            <span className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
                                            <span className="text-xs font-bold text-orange-600 dark:text-orange-400">~{totalCalories} kcal</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="hidden sm:flex items-center gap-4 px-4 py-2 bg-slate-50/50 dark:bg-slate-700/30 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                        <div className="text-center">
                                            <p className="text-base font-bold text-amber-600 dark:text-amber-400">{diet.morning.length}</p>
                                            <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-bold">Morning</p>
                                        </div>
                                        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />
                                        <div className="text-center">
                                            <p className="text-base font-bold text-sky-600 dark:text-sky-400">{diet.afternoon.length}</p>
                                            <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-bold">Afternoon</p>
                                        </div>
                                        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />
                                        <div className="text-center">
                                            <p className="text-base font-bold text-indigo-600 dark:text-indigo-400">{diet.night.length}</p>
                                            <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-bold">Night</p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setSidebarOpen(true)}
                                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100/80 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 text-xs font-bold hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-500 transition-all border border-transparent hover:border-emerald-200"
                                    >
                                        <CalendarIcon />
                                        {formatDate(selectedDate)}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 px-4 pb-24">
                    <div className="max-w-6xl mx-auto py-6">

                        {/* Toast Notification */}
                        {deleteMsg && (
                            <div className="fixed top-24 right-6 z-50 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-2xl rounded-2xl px-5 py-3 flex items-center gap-2 animate-bounce transition-colors">
                                <span className="text-emerald-500 font-bold">✓</span>
                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{deleteMsg}</span>
                            </div>
                        )}

                        {/* Loading State */}
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-32">
                                <div className="w-10 h-10 border-[3px] border-emerald-200 dark:border-emerald-800 border-t-emerald-500 rounded-full animate-spin mb-4" />
                                <p className="text-sm font-medium text-slate-400 dark:text-slate-500">Updating your plan...</p>
                            </div>
                        ) : (
                            /* Meal Cards Grid */
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {SLOTS.map(slot => {
                                    const recipes = diet[slot.key];
                                    const slotCalories = recipes.reduce((sum, r) => sum + (parseInt(r.calories) || 0), 0);

                                    return (
                                        <div
                                            key={slot.key}
                                            onClick={() => recipes.length > 0 && openSlotModal(slot.key)}
                                            className={`group bg-white dark:bg-slate-800/80 rounded-[32px] shadow-sm border-2 ${slot.border} overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1.5 cursor-pointer ${recipes.length === 0 ? 'opacity-85' : ''}`}
                                        >
                                            {/* Header */}
                                            <div className={`bg-gradient-to-r ${slot.color} p-6 text-white relative overflow-hidden`}>
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl pointer-events-none" />

                                                <div className="relative flex items-start justify-between">
                                                    <div>
                                                        <div className="flex items-center gap-2.5 mb-1.5">
                                                            <span className="text-2xl drop-shadow-md">{slot.emoji}</span>
                                                            <h3 className="font-extrabold text-xl tracking-tight">{slot.label}</h3>
                                                        </div>
                                                        <p className="text-white/80 text-[11px] font-bold uppercase tracking-wider">{slot.time}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-3xl font-black drop-shadow-md">{recipes.length}</p>
                                                        <p className="text-white/80 text-[10px] font-bold uppercase tracking-widest">meals</p>
                                                    </div>
                                                </div>

                                                {slotCalories > 0 && (
                                                    <div className="mt-4 pt-4 border-t border-white/20 flex items-center gap-2">
                                                        <span className="text-xs font-bold text-white/90 bg-white/10 px-2 py-1 rounded-lg">🔥 {slotCalories} kcal</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className={`p-6 ${slot.bg} min-h-[300px]`}>
                                                {recipes.length === 0 ? (
                                                    <div className="flex flex-col items-center justify-center h-full py-10 text-center">
                                                        <div className={`w-16 h-16 ${slot.iconBg} rounded-[22px] flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-6 transition-all`}>
                                                            <span className="text-3xl opacity-50 grayscale group-hover:grayscale-0 transition-all">{slot.emoji}</span>
                                                        </div>
                                                        <p className="text-slate-500 dark:text-slate-400 font-bold text-sm">No recipes planned</p>
                                                        <p className="text-slate-400 dark:text-slate-500 text-xs mt-1.5 font-medium">Add some tasty meals!</p>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3.5">
                                                        {recipes.slice(0, 3).map((recipe, i) => (
                                                            <div
                                                                key={recipe._id || i}
                                                                onClick={(e) => { e.stopPropagation(); openRecipeModal(recipe); }}
                                                                className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl p-3.5 shadow-sm border border-slate-100/50 dark:border-slate-700/50 hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all group/card relative"
                                                            >
                                                                <div className="flex items-start justify-between gap-3">
                                                                    <h4 className={`font-bold text-sm ${slot.text} line-clamp-1 flex-1 leading-tight`}>{recipe.recipeName}</h4>
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); handleRemove(slot.key, recipe._id); }}
                                                                        className="opacity-0 group-hover/card:opacity-100 transition-all p-1.5 hover:bg-red-50 dark:hover:bg-red-500/20 rounded-xl"
                                                                    >
                                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3">
                                                                            <path d="M18 6L6 18M6 6l12 12" />
                                                                        </svg>
                                                                    </button>
                                                                </div>

                                                                <div className="flex flex-wrap gap-2 mt-2.5">
                                                                    {recipe.calories && (
                                                                        <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-lg text-slate-600 dark:text-slate-300 font-bold shadow-sm">
                                                                            🔥 {recipe.calories}
                                                                        </span>
                                                                    )}
                                                                    {recipe.protein && (
                                                                        <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-lg text-slate-600 dark:text-slate-300 font-bold shadow-sm">
                                                                            💪 {recipe.protein}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}

                                                        {recipes.length > 3 && (
                                                            <div className="text-center py-2">
                                                                <span className={`text-[11px] ${slot.text} font-bold bg-white/50 dark:bg-black/20 px-3 py-1.5 rounded-full border border-current opacity-60`}>
                                                                    +{recipes.length - 3} more recipes
                                                                </span>
                                                            </div>
                                                        )}

                                                        <div className="pt-4 text-center">
                                                            <span className={`text-xs font-bold ${slot.text} opacity-60 group-hover:opacity-100 transition-all flex items-center justify-center gap-2 group-hover:translate-x-1`}>
                                                                View detail plan <span className="text-base">→</span>
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Slot Modal - Shows all recipes in a slot */}
            {selectedSlot && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={closeModals}>
                    <div className="bg-white dark:bg-slate-800 rounded-[32px] shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden animate-fadeIn" onClick={e => e.stopPropagation()}>
                        <div className={`bg-gradient-to-r ${selectedSlot.color} p-6 text-white`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <span className="text-4xl drop-shadow-md">{selectedSlot.emoji}</span>
                                    <div>
                                        <h3 className="font-black text-2xl tracking-tight leading-tight">{selectedSlot.label} Meals</h3>
                                        <p className="text-white/80 text-xs font-bold uppercase tracking-widest">{diet[selectedSlot.key].length} recipes planned</p>
                                    </div>
                                </div>
                                <button onClick={closeModals} className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center hover:bg-white/30 transition-all active:scale-95 px-0">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                        <path d="M18 6L6 18M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className={`p-6 ${selectedSlot.bg} overflow-y-auto max-h-[60vh] custom-scrollbar`}>
                            <div className="space-y-4">
                                {diet[selectedSlot.key].map((recipe, i) => (
                                    <div
                                        key={recipe._id || i}
                                        onClick={() => { closeModals(); setTimeout(() => openRecipeModal(recipe), 100); }}
                                        className="bg-white/95 dark:bg-slate-800/95 rounded-2xl p-4.5 shadow-md border border-slate-100 dark:border-slate-700 hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-500 transition-all cursor-pointer group/item"
                                    >
                                        <div className="flex items-start justify-between mb-3 gap-3">
                                            <h4 className={`font-black text-lg ${selectedSlot.text} leading-tight`}>{recipe.recipeName}</h4>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleRemove(selectedSlot.key, recipe._id); }}
                                                className="p-2 hover:bg-red-50 dark:hover:bg-red-500/20 rounded-xl transition-all"
                                            >
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5">
                                                    <path d="M18 6L6 18M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>

                                        <div className="flex flex-wrap gap-2.5 mb-4">
                                            {recipe.calories && (
                                                <span className="text-xs font-bold bg-orange-100/80 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 px-3 py-1.5 rounded-xl">
                                                    🔥 {recipe.calories} kcal
                                                </span>
                                            )}
                                            {recipe.protein && (
                                                <span className="text-xs font-bold bg-blue-100/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 px-3 py-1.5 rounded-xl">
                                                    💪 {recipe.protein}
                                                </span>
                                            )}
                                            {recipe.best_time && (
                                                <span className="text-xs font-bold bg-purple-100/80 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 px-3 py-1.5 rounded-xl">
                                                    🕐 {recipe.best_time}
                                                </span>
                                            )}
                                        </div>

                                        {recipe.ingredients && (
                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                                <span className="font-extrabold text-slate-700 dark:text-slate-300">Ingredients:</span> {recipe.ingredients.slice(0, 5).join(", ")}
                                                {recipe.ingredients.length > 5 ? ` +${recipe.ingredients.length - 5} others` : ""}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Recipe Detail Modal */}
            {selectedRecipe && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={closeModals}>
                    <div className="bg-white dark:bg-slate-800 rounded-[40px] shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden animate-fadeIn" onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-8 text-white relative">
                            <button onClick={closeModals} className="absolute top-6 right-6 w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center hover:bg-white/30 transition-all px-0">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                            </button>
                            <h3 className="text-2xl font-black pr-12 leading-tight drop-shadow-sm">{selectedRecipe.recipeName}</h3>
                            <div className="flex flex-wrap gap-2.5 mt-5">
                                {selectedRecipe.calories && (
                                    <span className="text-xs font-extrabold bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl">🔥 {selectedRecipe.calories} kcal</span>
                                )}
                                {selectedRecipe.protein && (
                                    <span className="text-xs font-extrabold bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl">💪 {selectedRecipe.protein} protein</span>
                                )}
                                {selectedRecipe.best_time && (
                                    <span className="text-xs font-extrabold bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl">🕐 Best: {selectedRecipe.best_time}</span>
                                )}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-8 overflow-y-auto max-h-[60vh] custom-scrollbar">
                            {/* Ingredients */}
                            {selectedRecipe.ingredients && selectedRecipe.ingredients.length > 0 && (
                                <div className="mb-8">
                                    <h4 className="font-black text-slate-800 dark:text-white mb-4 flex items-center gap-3">
                                        <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                            </svg>
                                        </div>
                                        Required Ingredients
                                    </h4>
                                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {selectedRecipe.ingredients.map((ing, i) => (
                                            <li key={i} className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-900/10">
                                                <span className="w-2.5 h-2.5 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full shadow-sm" />
                                                {ing}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Steps */}
                            {selectedRecipe.steps && selectedRecipe.steps.length > 0 && (
                                <div className="mb-8">
                                    <h4 className="font-black text-slate-800 dark:text-white mb-4 flex items-center gap-3">
                                        <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/40 rounded-xl flex items-center justify-center text-orange-600 dark:text-orange-400">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <path d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                            </svg>
                                        </div>
                                        Cooking Steps
                                    </h4>
                                    <ol className="space-y-4">
                                        {selectedRecipe.steps.map((step, i) => (
                                            <li key={i} className="flex gap-4 group/step">
                                                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 text-white rounded-xl flex items-center justify-center text-xs font-black shrink-0 shadow-lg shadow-emerald-200 dark:shadow-none group-hover/step:scale-110 transition-transform">
                                                    {i + 1}
                                                </div>
                                                <p className="text-sm font-bold text-slate-600 dark:text-slate-300 leading-relaxed pt-1.5">{step}</p>
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                            )}

                            {/* Reason */}
                            {selectedRecipe.reason && (
                                <div className="bg-gradient-to-br from-indigo-50 to-emerald-50 dark:from-indigo-950/20 dark:to-emerald-950/20 rounded-[30px] p-6 border-2 border-white dark:border-slate-700/50 shadow-inner">
                                    <h4 className="font-black text-indigo-700 dark:text-indigo-300 mb-3 flex items-center gap-2 text-sm italic">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                            <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Nutritional Insight
                                    </h4>
                                    <p className="text-sm font-bold text-slate-600 dark:text-slate-300 leading-relaxed indent-4">{selectedRecipe.reason}</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                            <button onClick={closeModals} className="px-8 py-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95">
                                Got it
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Styles */}
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.2); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(148, 163, 184, 0.4); }
                
                @keyframes fadeIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fadeIn { animation: fadeIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
            `}</style>
        </div>
    );
}