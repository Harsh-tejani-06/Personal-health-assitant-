import API from "../api/axios";

// Log or update daily activity
export const logActivity = async (date, type, completed, details = "", duration = 0) => {
    const res = await API.post("/activity/log", { date, type, completed, details, duration });
    return res.data;
};

// Get activity for a specific date
export const getActivity = async (date) => {
    const res = await API.get(`/activity/${date}`);
    return res.data;
};

// Get activity history (last 30 days)
export const getActivityHistory = async () => {
    const res = await API.get("/activity/history");
    return res.data;
};
