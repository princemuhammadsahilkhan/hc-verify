import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ShieldCheck, KeyRound, User } from "lucide-react";
import toast from "react-hot-toast";

import API from "../api";

function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);

      const response = await API.post("/admin/login", {
        username,
        password
      });

      localStorage.setItem("adminToken", response.data.access_token);

      const destination = location.state?.from || "/admin";
      navigate(destination, { replace: true });

      toast.success("Admin access granted");

    } catch (error) {
      console.log(error);
      toast.error(
        error.response?.data?.detail || "Admin login failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div className="eyebrow">
          <ShieldCheck size={16} />
          Admin access
        </div>
        <h1 className="section-title">
          Admin login
        </h1>
        <p className="section-subtitle">
          Secure access for election supervisors only.
        </p>
      </div>

      <div className="card form-card">
        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <div className="input-wrap">
              <User size={16} />
              <input
                type="text"
                className="input"
                placeholder="Admin username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-wrap">
              <KeyRound size={16} />
              <input
                type="password"
                className="input"
                placeholder="Admin password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              className={`button${loading ? " is-loading" : ""}`}
              type="submit"
            >
              {loading ? "Signing in..." : "Access admin dashboard"}
            </button>
            <span className="form-hint">
              Admin access is restricted to authorized supervisors.
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminLogin;
