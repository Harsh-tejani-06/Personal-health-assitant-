import API from "../api/axios";

// Get user's exercise plan
export const getExercisePlan = async () => {
    const res = await API.get("/exercise/plan");
    return res.data;
};

// Generate / regenerate AI exercise plan
export const generateExercisePlan = async () => {
    const res = await API.post("/exercise/plan");
    return res.data;
};

// Log daily exercise completion
export const logExerciseTask = async (date, morningCompleted, nightCompleted, notes = "") => {
    const res = await API.post("/exercise/log", { date, morningCompleted, nightCompleted, notes });
    return res.data;
};

// Get log for a specific date
export const getExerciseLog = async (date) => {
    const res = await API.get(`/exercise/log/${date}`);
    return res.data;
};

// Get calendar data (last 31 days)
export const getExerciseCalendar = async () => {
    const res = await API.get("/exercise/calendar");
    return res.data;
};

// Get next-day AI suggestions
export const getNextDaySuggestions = async () => {
    const res = await API.post("/exercise/next-day");
    return res.data;
};
