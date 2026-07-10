import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import Dashboard from "../pages/Dashboard";
import Users from "../pages/Users";
import Roles from "../pages/Roles";
import Districts from "../pages/Districts";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
      <Route path="/admin/roles" element={<ProtectedRoute><Roles /></ProtectedRoute>} />
      <Route path="/admin/districts" element={<ProtectedRoute><Districts /></ProtectedRoute>} />
    </Routes>
  );
}

