import API from "../api/axios";

// SIGNUP
export const signupUser = async (data) => {
  const res = await API.post("/auth/signup", data);
  localStorage.setItem("token", res.data.token);
  return res.data;
};

// LOGIN
export const loginUser = async (data) => {
  const res = await API.post("/auth/login", data);
  localStorage.setItem("token", res.data.token);
  return res.data;
};
