import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import GetStarted from "./components/GetStarted";
import Auth from "./components/Auth";
import Questionnaire from "./components/Questionnaire";
import AIQuestions from "./components/AIQuestions";

import MainLayout from "./components/layout/MainLayout";

import Dashboard from "./components/pages/Dashboard";
import Exercise from "./components/pages/Exercise";
import SkinCare from "./components/pages/SkinCare";
import Recipes from "./components/pages/Recipes";
import Chatbot from "./components/pages/Chatbot";
import Diet from "./components/pages/Diet";
import Activity from "./components/pages/Activity";
import Leaderboard from "./components/pages/Leaderboard";

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<GetStarted />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/questionnaire" element={<Questionnaire />} />
          <Route path="/ai-questions" element={<AIQuestions />} />
          {/* Sidebar Layout */}
          <Route element={<MainLayout />}>

            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/exercise" element={<Exercise />} />
            <Route path="/skin-care" element={<SkinCare />} />
            <Route path="/recipes" element={<Recipes />} />
            <Route path="/chatbot" element={<Chatbot />} />
            <Route path="/diet" element={<Diet />} />
            <Route path="/activity" element={<Activity />} />
            <Route path="/leaderboard" element={<Leaderboard />} />

          </Route>

        </Routes>

      </BrowserRouter>
    </ThemeProvider>
  );
}
