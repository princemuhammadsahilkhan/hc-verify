import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ShieldCheck, UserPlus, LogIn, User, Mail, KeyRound, MapPin } from "lucide-react";
import toast from "react-hot-toast";

import API from "../api";

function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mode, setMode] = useState("register");
  const [loading, setLoading] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    full_name: "",
    email: "",
    password: "",
    district: "",
  });
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("voterToken");
    if (token) {
      navigate("/profile", { replace: true });
      return;
    }

    if (location.state?.mode === "login") {
      setMode("login");
    }
  }, [location.state]);

  const handleRegisterChange = (event) => {
    setRegisterForm((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const handleLoginChange = (event) => {
    setLoginForm((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    try {
      setLoading(true);
      const response = await API.post("/auth/register", registerForm);
      toast.success(response.data.message || "Registered successfully");
      setMode("login");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    try {
      setLoading(true);
      const response = await API.post("/auth/login", loginForm);
      localStorage.setItem("voterToken", response.data.access_token);
      toast.success("Logged in successfully");
      navigate("/profile");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div className="eyebrow">
          <ShieldCheck size={16} />
          Voter account
        </div>
        <h1 className="section-title">Secure voter auth</h1>
        <p className="section-subtitle">
          Create your voter account with email and password, sign in, then continue to voter registration.
        </p>
      </div>

      <div className="card form-card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
          <button className={`button${mode === "register" ? "" : " secondary"}`} type="button" onClick={() => setMode("register")}>
            <UserPlus size={14} /> Register
          </button>
          <button className={`button${mode === "login" ? "" : " secondary"}`} type="button" onClick={() => setMode("login")}>
            <LogIn size={14} /> Login
          </button>
        </div>

        {mode === "register" ? (
          <form className="form-grid" onSubmit={handleRegister}>
            <div className="form-group">
              <label className="form-label">Full name</label>
              <div className="input-wrap"><User size={16} /><input className="input" name="full_name" value={registerForm.full_name} onChange={handleRegisterChange} required /></div>
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <div className="input-wrap"><Mail size={16} /><input type="email" className="input" name="email" value={registerForm.email} onChange={handleRegisterChange} required /></div>
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-wrap"><KeyRound size={16} /><input type="password" className="input" name="password" value={registerForm.password} onChange={handleRegisterChange} required /></div>
            </div>
            <div className="form-group">
              <label className="form-label">District</label>
              <div className="input-wrap"><MapPin size={16} /><input className="input" name="district" value={registerForm.district} onChange={handleRegisterChange} required /></div>
            </div>
            <div className="form-actions">
              <button className={`button${loading ? " is-loading" : ""}`} type="submit">{loading ? "Registering..." : "Create voter account"}</button>
              <span className="form-hint">This uses the new /auth/register endpoint.</span>
            </div>
          </form>
        ) : (
          <form className="form-grid" onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <div className="input-wrap"><Mail size={16} /><input type="email" className="input" name="email" value={loginForm.email} onChange={handleLoginChange} required /></div>
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-wrap"><KeyRound size={16} /><input type="password" className="input" name="password" value={loginForm.password} onChange={handleLoginChange} required /></div>
            </div>
            <div className="form-actions">
              <button className={`button${loading ? " is-loading" : ""}`} type="submit">{loading ? "Signing in..." : "Login"}</button>
              <span className="form-hint">This uses the new /auth/login endpoint.</span>
            </div>
          </form>
        )}
      </div>

    </div>
  );
}

export default AuthPage;