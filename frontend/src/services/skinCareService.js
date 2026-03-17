import API from "../api/axios";

// Get user's skincare plan
export const getSkinCarePlan = async () => {
    const res = await API.get("/skincare/plan");
    return res.data;
};

// Generate / update skincare plan with products
export const generateSkinCarePlan = async (products) => {
    const res = await API.post("/skincare/plan", { products });
    return res.data;
};

// Log daily task completion
export const logSkinCareTask = async (date, morningCompleted, nightCompleted, notes = "") => {
    const res = await API.post("/skincare/log", { date, morningCompleted, nightCompleted, notes });
    return res.data;
};

// Get log for a specific date
export const getSkinCareLog = async (date) => {
    const res = await API.get(`/skincare/log/${date}`);
    return res.data;
};

// Get calendar data (last 31 days)
export const getSkinCareCalendar = async () => {
    const res = await API.get("/skincare/calendar");
    return res.data;
};
