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

// Logout
export const logoutUser = () => {
  localStorage.removeItem("token");
  window.location.href = "/auth";
};

// Check if user is logged in
export const isLoggedIn = () => {
  return !!localStorage.getItem("token");
};

// Forgot Password — Send OTP to email
export const sendForgotPasswordOtp = async (email) => {
  const res = await API.post("/auth/forgot-password", { email });
  return res.data;
};

// Verify OTP
export const verifyOtp = async (email, otp) => {
  const res = await API.post("/auth/verify-otp", { email, otp });
  return res.data;
};

// Reset Password with verified OTP
export const resetPassword = async (email, otp, newPassword) => {
  const res = await API.post("/auth/reset-password", { email, otp, newPassword });
  return res.data;
};
