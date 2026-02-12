import API from "../api/axios";

// Signup
export const signupUser = async (data) => {
  const res = await API.post("/auth/signup", data);
  localStorage.setItem("token", res.data.token);
  return res.data;
};

// Login
export const loginUser = async (data) => {
  const res = await API.post("/auth/login", data);
  localStorage.setItem("token", res.data.token);
  return res.data;
};
