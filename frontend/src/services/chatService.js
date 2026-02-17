import API from "../api/axios";

const BASE = "http://localhost:5000/api";

// Get list of dates with chat history
export const getChatDates = async () => {
    const res = await API.get("/chat/dates");
    return res.data;
};

// Get messages for a specific date
export const getChatHistory = async (date) => {
    const res = await API.get(`/chat/history/${date}`);
    return res.data;
};

// Send message with streaming (returns a reader for SSE)
export const sendMessageStream = async (message) => {
    const token = localStorage.getItem("token");

    const response = await fetch(`${BASE}/chat/send`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message })
    });

    return response;
};
