import {
  ShieldCheck,
  Users,
  Vote as VoteIcon,
  Activity,
  AlertTriangle
} from "lucide-react";
import { useNavigate } from "react-router-dom";

function AdminPage() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/admin-login", { replace: true });
  };

  return (
    <div className="page">
      <div className="page-header admin-header">
        <div className="eyebrow">
          <ShieldCheck size={16} />
          Administration
        </div>
        <div className="admin-title-row">
          <h1 className="section-title">Election command center</h1>
          <span className="admin-pill success">Live</span>
        </div>
        <p className="section-subtitle">
          Monitor participation, turnout, and system integrity in real time.
        </p>
        <div className="form-actions" style={{ marginTop: 16 }}>
          <button className="button secondary" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </div>

      <div className="admin-grid">
        <div className="card admin-metric">
          <div className="metric-icon">
            <Users size={18} />
          </div>
          <div>
            <p>Total voters</p>
            <h3>3</h3>
          </div>
        </div>

        <div className="card admin-metric">
          <div className="metric-icon">
            <VoteIcon size={18} />
          </div>
          <div>
            <p>Votes cast</p>
            <h3>3</h3>
          </div>
        </div>

        <div className="card admin-metric">
          <div className="metric-icon">
            <Activity size={18} />
          </div>
          <div>
            <p>Turnout</p>
            <h3>100%</h3>
          </div>
        </div>

        <div className="card admin-metric">
          <div className="metric-icon">
            <AlertTriangle size={18} />
          </div>
          <div>
            <p>Fraud alerts</p>
            <h3>0</h3>
          </div>
        </div>
      </div>

      <div className="admin-panels">
        <div className="card admin-panel">
          <div className="card-header">
            <div>
              <h2 className="card-title">Operational status</h2>
              <p className="card-subtitle">
                All core services are reporting healthy.
              </p>
            </div>
            <span className="admin-pill success">Healthy</span>
          </div>

          <div className="admin-list">
            <div className="admin-row">
              <span>Identity verification</span>
              <span className="admin-pill success">Active</span>
            </div>
            <div className="admin-row">
              <span>Ballot ledger sync</span>
              <span className="admin-pill success">Active</span>
            </div>
            <div className="admin-row">
              <span>Security monitoring</span>
              <span className="admin-pill neutral">Enabled</span>
            </div>
          </div>
        </div>

        <div className="card admin-panel">
          <div className="card-header">
            <div>
              <h2 className="card-title">Election integrity</h2>
              <p className="card-subtitle">
                Current safeguards and audit checks.
              </p>
            </div>
            <span className="admin-pill neutral">Protected</span>
          </div>

          <div className="admin-list">
            <div className="admin-row">
              <span>Duplicate registration blocks</span>
              <span className="admin-pill success">Active</span>
            </div>
            <div className="admin-row">
              <span>Receipt verification</span>
              <span className="admin-pill success">Active</span>
            </div>
            <div className="admin-row">
              <span>Fraud alerts</span>
              <span className="admin-pill warning">0 active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminPage;