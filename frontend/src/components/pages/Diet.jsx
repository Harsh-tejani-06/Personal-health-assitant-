import { useState, useEffect } from "react";
import { getDietDates, getDiet, removeFromDiet } from "../../services/dietService";

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
    { key: "morning", label: "Morning", emoji: "🌅", time: "6:00 - 11:00 AM", color: "from-amber-400 to-orange-500", bg: "bg-gradient-to-br from-amber-50 to-orange-50", border: "border-amber-200", text: "text-amber-700", iconBg: "bg-amber-100" },
    { key: "afternoon", label: "Afternoon", emoji: "☀️", time: "12:00 - 4:00 PM", color: "from-sky-400 to-blue-500", bg: "bg-gradient-to-br from-sky-50 to-blue-50", border: "border-sky-200", text: "text-sky-700", iconBg: "bg-sky-100" },
    { key: "night", label: "Night", emoji: "🌙", time: "6:00 - 9:00 PM", color: "from-indigo-400 to-purple-500", bg: "bg-gradient-to-br from-indigo-50 to-purple-50", border: "border-indigo-200", text: "text-indigo-700", iconBg: "bg-indigo-100" }
];

export default function Diet() {
    const [dates, setDates] = useState([]);
    const [selectedDate, setSelectedDate] = useState(getTodayDate());
    const [showDates, setShowDates] = useState(false);
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
        } catch (err) {
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

    return (
        <div className="max-w-6xl mx-auto p-4 pb-24">
            
            {/* Header Card */}
            <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-6 mb-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-100/50 to-teal-100/50 rounded-full blur-3xl -mr-20 -mt-20" />
                
                <div className="relative flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center text-white text-3xl shadow-xl shadow-emerald-200">
                            🥗
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">My Diet Plan</h1>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="text-sm text-slate-500">{formatDate(selectedDate)}</span>
                                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                <span className="text-sm font-medium text-emerald-600">{totalRecipes} meals</span>
                                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                <span className="text-sm font-medium text-orange-600">~{totalCalories} kcal</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Quick stats */}
                        <div className="hidden sm:flex items-center gap-4 px-4 py-2 bg-slate-50 rounded-xl">
                            <div className="text-center">
                                <p className="text-lg font-bold text-amber-600">{diet.morning.length}</p>
                                <p className="text-[10px] text-slate-400 uppercase">Morning</p>
                            </div>
                            <div className="w-px h-8 bg-slate-200" />
                            <div className="text-center">
                                <p className="text-lg font-bold text-sky-600">{diet.afternoon.length}</p>
                                <p className="text-[10px] text-slate-400 uppercase">Afternoon</p>
                            </div>
                            <div className="w-px h-8 bg-slate-200" />
                            <div className="text-center">
                                <p className="text-lg font-bold text-indigo-600">{diet.night.length}</p>
                                <p className="text-[10px] text-slate-400 uppercase">Night</p>
                            </div>
                        </div>

                        {/* Date picker */}
                        <div className="relative">
                            <button
                                onClick={() => setShowDates(!showDates)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${showDates
                                    ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white shadow-lg shadow-emerald-200'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="4" width="18" height="18" rx="2" />
                                    <path d="M16 2v4M8 2v4M3 10h18" />
                                </svg>
                                {formatDate(selectedDate)}
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" 
                                    style={{ transform: showDates ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                                    <path d="M6 9l6 6 6-6" />
                                </svg>
                            </button>

                            {/* Dropdown */}
                            {showDates && (
                                <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-50 animate-in fade-in slide-in-from-top-2">
                                    <p className="text-xs font-semibold text-slate-400 uppercase px-3 py-2">Select Date</p>
                                    <div className="max-h-48 overflow-y-auto space-y-1">
                                        {dates.map(d => (
                                            <button
                                                key={d}
                                                onClick={() => { setSelectedDate(d); setShowDates(false); }}
                                                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all flex items-center justify-between ${d === selectedDate
                                                    ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white'
                                                    : 'text-slate-600 hover:bg-slate-50'
                                                }`}
                                            >
                                                <span>{formatDate(d)}</span>
                                                {d === selectedDate && <span className="text-xs opacity-70">●</span>}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Toast Notification */}
            {deleteMsg && (
                <div className="fixed top-24 right-6 z-50 bg-white border border-slate-200 shadow-2xl rounded-2xl px-5 py-3 flex items-center gap-2 animate-in slide-in-from-right">
                    <span className="text-emerald-500">✓</span>
                    <span className="text-sm font-medium text-slate-700">{deleteMsg}</span>
                </div>
            )}

            {/* Loading State */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-12 h-12 border-3 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mb-4" />
                    <p className="text-slate-400">Loading your diet plan...</p>
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
                                className={`group bg-white rounded-3xl shadow-sm border-2 ${slot.border} overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1 cursor-pointer ${recipes.length === 0 ? 'opacity-80' : ''}`}
                            >
                                {/* Header */}
                                <div className={`bg-gradient-to-r ${slot.color} p-5 text-white relative overflow-hidden`}>
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl" />
                                    
                                    <div className="relative flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-2xl">{slot.emoji}</span>
                                                <h3 className="font-bold text-xl">{slot.label}</h3>
                                            </div>
                                            <p className="text-white/70 text-xs">{slot.time}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-3xl font-bold">{recipes.length}</p>
                                            <p className="text-white/70 text-xs">meals</p>
                                        </div>
                                    </div>
                                    
                                    {slotCalories > 0 && (
                                        <div className="mt-3 pt-3 border-t border-white/20 flex items-center gap-2">
                                            <span className="text-xs text-white/80">🔥 {slotCalories} kcal</span>
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className={`p-5 ${slot.bg} min-h-[280px]`}>
                                    {recipes.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                                            <div className={`w-16 h-16 ${slot.iconBg} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                                <span className="text-3xl opacity-40">{slot.emoji}</span>
                                            </div>
                                            <p className="text-slate-500 font-medium">No recipes planned</p>
                                            <p className="text-slate-400 text-sm mt-1">Tap to add meals</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {recipes.slice(0, 3).map((recipe, i) => (
                                                <div 
                                                    key={recipe._id || i}
                                                    onClick={(e) => { e.stopPropagation(); openRecipeModal(recipe); }}
                                                    className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 hover:shadow-md transition-all group/card"
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <h4 className={`font-semibold text-sm ${slot.text} line-clamp-1 flex-1`}>{recipe.recipeName}</h4>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleRemove(slot.key, recipe._id); }}
                                                            className="opacity-0 group-hover/card:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded-lg"
                                                        >
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="red" strokeWidth="2">
                                                                <path d="M18 6L6 18M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                    
                                                    <div className="flex gap-2 mt-2">
                                                        {recipe.calories && (
                                                            <span className="text-[10px] bg-slate-100 px-2 py-1 rounded-full text-slate-600 font-medium">
                                                                🔥 {recipe.calories}
                                                            </span>
                                                        )}
                                                        {recipe.protein && (
                                                            <span className="text-[10px] bg-slate-100 px-2 py-1 rounded-full text-slate-600 font-medium">
                                                                💪 {recipe.protein}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            
                                            {recipes.length > 3 && (
                                                <div className="text-center py-2">
                                                    <span className={`text-xs ${slot.text} font-medium`}>
                                                        +{recipes.length - 3} more recipes
                                                    </span>
                                                </div>
                                            )}
                                            
                                            <div className="pt-2 text-center">
                                                <span className={`text-xs ${slot.text} opacity-70 group-hover:opacity-100 transition-opacity`}>
                                                    Tap to view all →
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

            {/* Slot Modal - Shows all recipes in a slot */}
            {selectedSlot && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={closeModals}>
                    <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                        <div className={`bg-gradient-to-r ${selectedSlot.color} p-6 text-white`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl">{selectedSlot.emoji}</span>
                                    <div>
                                        <h3 className="font-bold text-2xl">{selectedSlot.label} Meals</h3>
                                        <p className="text-white/70">{diet[selectedSlot.key].length} recipes planned</p>
                                    </div>
                                </div>
                                <button onClick={closeModals} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M18 6L6 18M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        
                        <div className={`p-6 ${selectedSlot.bg} overflow-y-auto max-h-[60vh]`}>
                            <div className="space-y-4">
                                {diet[selectedSlot.key].map((recipe, i) => (
                                    <div 
                                        key={recipe._id || i}
                                        onClick={() => { closeModals(); setTimeout(() => openRecipeModal(recipe), 100); }}
                                        className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-all cursor-pointer"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <h4 className={`font-bold text-lg ${selectedSlot.text}`}>{recipe.recipeName}</h4>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleRemove(selectedSlot.key, recipe._id); }}
                                                className="p-2 hover:bg-red-50 rounded-xl transition-colors"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="red" strokeWidth="2">
                                                    <path d="M18 6L6 18M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                        
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {recipe.calories && (
                                                <span className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-medium">
                                                    🔥 {recipe.calories} kcal
                                                </span>
                                            )}
                                            {recipe.protein && (
                                                <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                                                    💪 {recipe.protein}
                                                </span>
                                            )}
                                            {recipe.best_time && (
                                                <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium">
                                                    🕐 {recipe.best_time}
                                                </span>
                                            )}
                                        </div>
                                        
                                        {recipe.ingredients && (
                                            <p className="text-sm text-slate-600 line-clamp-2">
                                                <span className="font-medium">Ingredients:</span> {recipe.ingredients.slice(0, 5).join(", ")}
                                                {recipe.ingredients.length > 5 ? ` +${recipe.ingredients.length - 5} more` : ""}
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
                    <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className="bg-gradient-to-r from-emerald-400 to-teal-500 p-6 text-white relative">
                            <button onClick={closeModals} className="absolute top-4 right-4 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                            </button>
                            <h3 className="text-2xl font-bold pr-12">{selectedRecipe.recipeName}</h3>
                            <div className="flex flex-wrap gap-2 mt-3">
                                {selectedRecipe.calories && (
                                    <span className="text-xs bg-white/20 px-3 py-1 rounded-full">🔥 {selectedRecipe.calories}</span>
                                )}
                                {selectedRecipe.protein && (
                                    <span className="text-xs bg-white/20 px-3 py-1 rounded-full">💪 {selectedRecipe.protein}</span>
                                )}
                                {selectedRecipe.best_time && (
                                    <span className="text-xs bg-white/20 px-3 py-1 rounded-full">🕐 {selectedRecipe.best_time}</span>
                                )}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto max-h-[60vh]">
                            {/* Ingredients */}
                            {selectedRecipe.ingredients && selectedRecipe.ingredients.length > 0 && (
                                <div className="mb-6">
                                    <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                                        <span className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">📝</span>
                                        Ingredients
                                    </h4>
                                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {selectedRecipe.ingredients.map((ing, i) => (
                                            <li key={i} className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-2 rounded-lg">
                                                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                                                {ing}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Steps */}
                            {selectedRecipe.steps && selectedRecipe.steps.length > 0 && (
                                <div className="mb-6">
                                    <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                                        <span className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">👨‍🍳</span>
                                        Instructions
                                    </h4>
                                    <ol className="space-y-3">
                                        {selectedRecipe.steps.map((step, i) => (
                                            <li key={i} className="flex gap-3 text-sm text-slate-600">
                                                <span className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                                                    {i + 1}
                                                </span>
                                                <span className="leading-relaxed pt-0.5">{step}</span>
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                            )}

                            {/* Reason */}
                            {selectedRecipe.reason && (
                                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-4 border border-emerald-100">
                                    <h4 className="font-bold text-emerald-800 mb-2 text-sm">Why this recipe?</h4>
                                    <p className="text-sm text-emerald-700 leading-relaxed">{selectedRecipe.reason}</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-slate-100 flex justify-end">
                            <button onClick={closeModals} className="px-6 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}