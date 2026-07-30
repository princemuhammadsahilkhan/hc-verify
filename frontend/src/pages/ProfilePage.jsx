import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, User, Mail, MapPin, KeyRound, LogOut, Save, BadgeCheck } from "lucide-react";
import toast from "react-hot-toast";

import API from "../api";

function ProfilePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [receipts, setReceipts] = useState([]);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    district: "",
    password: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("voterToken");
    if (!token) {
      navigate("/auth", { replace: true });
      return;
    }

    const loadProfile = async () => {
      try {
        const response = await API.get("/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setProfile(response.data);
        setForm({
          full_name: response.data.full_name || "",
          email: response.data.email || "",
          district: response.data.district || "",
          password: "",
        });

        try {
          const receiptsRes = await API.get("/auth/receipts", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setReceipts(receiptsRes.data);
        } catch (e) {
          console.error("Failed to fetch receipts", e);
        }
      } catch (error) {
        localStorage.removeItem("voterToken");
        navigate("/auth", { replace: true });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [navigate]);

  const handleChange = (event) => {
    setForm((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      const token = localStorage.getItem("voterToken");
      const payload = {
        full_name: form.full_name,
        email: form.email,
        district: form.district,
      };

      if (form.password.trim()) {
        payload.password = form.password;
      }

      const response = await API.put("/auth/me", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setProfile(response.data.voter);
      setForm((prev) => ({ ...prev, password: "" }));
      toast.success(response.data.message || "Profile updated");
      navigate("/vote");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("voterToken");
    toast.success("Logged out");
    navigate("/auth", { replace: true });
  };

  if (loading) {
    return (
      <div className="page">
        <div className="card" style={{ padding: 28, textAlign: "center" }}>
          Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="eyebrow">
          <ShieldCheck size={16} />
          User dashboard
        </div>
        <h1 className="section-title">Profile and account settings</h1>
        <p className="section-subtitle">
          Edit your account details, keep your profile up to date, and log out when you are done.
        </p>
      </div>

      <div className="results-metrics" style={{ marginBottom: 20 }}>
        <div className="metric-card">
          <div className="metric-icon">
            <BadgeCheck size={18} />
          </div>
          <div>
            <p>Verification</p>
            <h3>Not verified</h3>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">
            <User size={18} />
          </div>
          <div>
            <p>Vote status</p>
            <h3>{profile?.has_voted ? "Voted" : "Not yet"}</h3>
          </div>
        </div>
      </div>

      <div className="card form-card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div>
            <h2 className="card-title">My Receipts</h2>
            <p className="card-subtitle">Your secure verification receipts</p>
          </div>
        </div>
        
        {receipts.length === 0 ? (
          <p className="helper-text" style={{ padding: "0 24px 24px" }}>No receipts found. You haven't voted yet.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Receipt Code</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {receipts.map((r, i) => (
                  <tr key={i}>
                    <td style={{ fontFamily: "monospace" }}>{r.receipt_code}</td>
                    <td>{new Date(r.timestamp).toLocaleDateString()}</td>
                    <td>
                      <button className="button secondary" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => navigate(`/verify-public?code=${r.receipt_code}`)}>
                        Verify
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card form-card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Edit profile</h2>
            <p className="card-subtitle">Your voter account settings</p>
          </div>
          <button className="button secondary" type="button" onClick={handleLogout}>
            <LogOut size={16} /> Logout
          </button>
        </div>

        <form className="form-grid" onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Full name</label>
            <div className="input-wrap">
              <User size={16} />
              <input className="input" name="full_name" value={form.full_name} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <div className="input-wrap">
              <Mail size={16} />
              <input type="email" className="input" name="email" value={form.email} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">District</label>
            <div className="input-wrap">
              <MapPin size={16} />
              <input className="input" name="district" value={form.district} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">New password</label>
            <div className="input-wrap">
              <KeyRound size={16} />
              <input type="password" className="input" name="password" value={form.password} onChange={handleChange} placeholder="Leave blank to keep current password" />
            </div>
          </div>

          <div className="form-actions" style={{ gridColumn: "1 / -1", marginTop: "16px" }}>
            <button className={`button${saving ? " is-loading" : ""}`} type="submit" style={{ width: "100%" }}>
              <Save size={16} /> {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProfilePage;