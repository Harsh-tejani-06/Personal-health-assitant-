import API from "../api/axios";

// Get all dates with diet entries
export const getDietDates = async () => {
    const res = await API.get("/diet/dates");
    return res.data;
};

// Get diet for a specific date
export const getDiet = async (date) => {
    const res = await API.get(`/diet/${date}`);
    return res.data;
};

// Add recipe to a meal slot
export const addToDiet = async (date, slot, recipe) => {
    const res = await API.post("/diet/add", { date, slot, recipe });
    return res.data;
};

// Remove recipe from a meal slot
export const removeFromDiet = async (date, slot, recipeId) => {
    const res = await API.delete("/diet/remove", {
        data: { date, slot, recipeId }
    });
    return res.data;
};
