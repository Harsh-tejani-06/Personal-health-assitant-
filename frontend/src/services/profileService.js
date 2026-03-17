import API from "../api/axios";

// Save basic questionnaire data
export const saveHealthProfile = async (data) => {
  const res = await API.post("/profile", data);
  return res.data;
};

export const generateAIQuestions = async (profileData) => {
  const res = await API.post("/ai-generate", {
    healthProfile: profileData
  });

  return res.data;
};

// Get saved AI questions
export const getAIQuestions = async () => {
  const res = await API.get("/ai-questions");
  return res.data;
};

export const saveAIAnswers = async (answers) => {
  const res = await API.post("/ai-answers", { answers });
  return res.data;
};

export const getOnboardingStatus = async () => {
  const res = await API.get("/onboarding-status");
  return res.data;
};

export const updateUserProfile = async (data) => {
  const res = await API.put("/profile", data);
  return res.data;
};
