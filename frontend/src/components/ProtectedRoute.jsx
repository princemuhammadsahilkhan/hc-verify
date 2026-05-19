import { Navigate, useLocation } from "react-router-dom";

function ProtectedRoute({ children }) {
  const location = useLocation();
  const token = localStorage.getItem("adminToken");

  if (!token) {
    return (
      <Navigate
        to="/admin-login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return children;
}

export default ProtectedRoute;
