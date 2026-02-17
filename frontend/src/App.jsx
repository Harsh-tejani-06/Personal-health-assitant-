import { BrowserRouter, Routes, Route } from "react-router-dom";
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

export default function App() {
  return (
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

        </Route>

      </Routes>

    </BrowserRouter>
  );
}
