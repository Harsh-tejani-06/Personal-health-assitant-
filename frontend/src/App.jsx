import { BrowserRouter, Routes, Route } from "react-router-dom";
import GetStarted from "./components/GetStarted";
import Auth from "./components/Auth";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<GetStarted />} />
        <Route path="/auth" element={<Auth />} />
      </Routes>

    </BrowserRouter>
  );
}
