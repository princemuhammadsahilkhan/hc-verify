import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Navbar from "./components/Navbar";

import HomePage from "./pages/HomePage";
import LandingPage from "./pages/LandingPage";
import RegisterPage from "./pages/RegisterPage";
import VotePage from "./pages/VotePage";
import VerifyPage from "./pages/VerifyPage";
import ResultsPage from "./pages/ResultsPage";
import AdminPage from "./pages/AdminPage";
import AdminLogin from "./pages/AdminLogin";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3200,
          style: {
            background: "rgba(255, 255, 255, 0.95)",
            color: "#0f172a",
            border: "1px solid rgba(15, 23, 42, 0.08)",
            boxShadow: "0 12px 30px rgba(15, 23, 42, 0.12)",
            borderRadius: "14px",
            padding: "12px 16px",
            fontWeight: 600
          }
        }}
      />
      <Navbar />

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/vote" element={<VotePage />} />
        <Route path="/verify" element={<VerifyPage />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route
          path="/results"
          element={
            <ProtectedRoute>
              <ResultsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;