import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import profileRoutes from "./routes/profileRoutes.js";
import aiProxyRoutes from "./routes/aiRoutes.js";
import recipeRoutes from "./routes/recipeRoutes.js";
import chatbotRoutes from "./routes/chatbotRoutes.js";
import path from "path";

// Serve uploads folder


import authRoutes from "./routes/authRoutes.js";

dotenv.config();
connectDB();

const app = express();

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api", profileRoutes);
app.use("/api", aiProxyRoutes);
app.use("/api", recipeRoutes);
app.use("/api", chatbotRoutes);


app.get("/", (req, res) => {
  res.send("Backend running");
});

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});
