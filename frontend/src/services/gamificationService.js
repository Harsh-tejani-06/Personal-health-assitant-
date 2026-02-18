import API from "../api/axios";

// Get current user's points, streak, rank
export const getMyPoints = async () => {
    const res = await API.get("/points/me");
    return res.data;
};

// Get leaderboard (top 20 users)
export const getLeaderboard = async () => {
    const res = await API.get("/points/leaderboard");
    return res.data;
};
