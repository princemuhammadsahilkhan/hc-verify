import { useEffect, useState } from "react";
import {
  ShieldCheck,
  Users,
  Vote as VoteIcon,
  Activity,
  AlertTriangle,
  UserX,
  CheckCircle2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import API from "../api";

function AdminPage() {
  const navigate = useNavigate();

  const [stats, setStats]     = useState({ total_voters: 0, votes_cast: 0, turnout: 0, pending: 0 });
  const [allVoters, setAllVoters] = useState([]);
  const [flagReason, setFlagReason] = useState({});
  const [pendingVoters, setPendingVoters]   = useState([]);
  const [candidates, setCandidates]         = useState([]);
  const [resolving, setResolving]           = useState(null); // voter_id being resolved
  const [selectedCandidate, setSelectedCandidate] = useState({});

  const token = localStorage.getItem("adminToken");

  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    loadStats();
    loadPendingVoters();
    loadCandidates();
    loadAllVoters();
  }, []);

  const loadStats = async () => {
    try {
      const res = await API.get("/admin/stats", authHeader);
      setStats(res.data);
    } catch (err) { console.error(err); }
  };

  const loadAllVoters = async () => {
    try {
      const res = await API.get("/admin/voters", authHeader);
      setAllVoters(res.data);
    } catch (err) { console.error(err); }
  };

  const handleFlagVoter = async (voterId) => {
    const reason = flagReason[voterId] || "Flagged by admin for manual review";
    try {
      await API.post(`/admin/flag-voter/${voterId}`, { reason }, authHeader);
      toast.success("Voter flagged for manual review");
      loadAllVoters();
      loadPendingVoters();
      loadStats();
    } catch (err) {
      toast.error("Failed to flag voter");
    }
  };

  const loadPendingVoters = async () => {
    try {
      const res = await API.get("/admin/pending-voters", authHeader);
      setPendingVoters(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadCandidates = async () => {
    try {
      const res = await API.get("/candidates");
      setCandidates(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleApprove = async (voterId) => {
    setResolving(voterId);
    try {
      await API.post(
        `/admin/resolve-pending/${voterId}`,
        { action: "approve" },
        authHeader
      );
      toast.success("Voter approved for normal voting");
      loadPendingVoters();
    } catch (err) {
      toast.error("Failed to approve voter");
    } finally {
      setResolving(null);
    }
  };

  const handleManualVote = async (voterId) => {
    const candidateId = selectedCandidate[voterId];
    if (!candidateId) {
      toast.error("Please select a candidate first");
      return;
    }
    setResolving(voterId);
    try {
      const res = await API.post(
        `/admin/resolve-pending/${voterId}`,
        { action: "manual_vote", candidate_id: parseInt(candidateId) },
        authHeader
      );
      toast.success(res.data.message);
      loadPendingVoters();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Manual vote failed");
    } finally {
      setResolving(null);
    }
  };

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
          <div className="metric-icon"><Users size={18} /></div>
          <div><p>Total voters</p><h3>{stats.total_voters}</h3></div>
        </div>
        <div className="card admin-metric">
          <div className="metric-icon"><VoteIcon size={18} /></div>
          <div><p>Votes cast</p><h3>{stats.votes_cast}</h3></div>
        </div>
        <div className="card admin-metric">
          <div className="metric-icon"><Activity size={18} /></div>
          <div><p>Turnout</p><h3>{stats.turnout}%</h3></div>
        </div>
        <div className="card admin-metric">
          <div className="metric-icon"><AlertTriangle size={18} /></div>
          <div>
            <p>Pending review</p>
            <h3 style={{ color: pendingVoters.length > 0 ? "var(--danger)" : "inherit" }}>
              {pendingVoters.length}
            </h3>
          </div>
        </div>
      </div>

      {/* ── PENDING VOTERS PANEL ─────────────────────────── */}
      <div className="admin-panels" style={{ marginBottom: 24 }}>
        <div className="card admin-panel" style={{ gridColumn: "1 / -1" }}>
          <div className="card-header">
            <div>
              <h2 className="card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <UserX size={18} /> Pending Investigation
              </h2>
              <p className="card-subtitle">
                Voters flagged for face mismatch — require manual ballot processing.
              </p>
            </div>
            <span className={`admin-pill ${pendingVoters.length > 0 ? "warning" : "success"}`}>
              {pendingVoters.length > 0 ? `${pendingVoters.length} pending` : "All clear"}
            </span>
          </div>

          {pendingVoters.length === 0 ? (
            <div className="admin-row">
              <span style={{ color: "var(--muted)" }}>No pending voters.</span>
              <span className="admin-pill success">✓ Clear</span>
            </div>
          ) : (
            <div className="admin-list">
              {pendingVoters.map((voter) => (
                <div
                  key={voter.voter_id}
                  className="admin-row"
                  style={{
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: 12,
                    padding: "16px 0",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  {/* Voter info */}
                  <div style={{ display: "flex", justifyContent: "space-between", width: "100%", flexWrap: "wrap", gap: 8 }}>
                    <div>
                      <strong>{voter.full_name}</strong>
                      <span style={{ color: "var(--muted)", marginLeft: 10, fontSize: 13 }}>
                        {voter.voter_id}
                      </span>
                      <span style={{ color: "var(--muted)", marginLeft: 10, fontSize: 13 }}>
                        CNIC: {voter.cnic}
                      </span>
                    </div>
                    <span className="admin-pill warning">Flagged</span>
                  </div>

                  {/* Reason */}
                  <div style={{ fontSize: 13, color: "var(--muted)" }}>
                    {voter.pending_reason}
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                    {/* Approve — let them vote normally */}
                    <button
                      className="button"
                      style={{ fontSize: 13, padding: "8px 16px" }}
                      onClick={() => handleApprove(voter.voter_id)}
                      disabled={resolving === voter.voter_id}
                    >
                      <CheckCircle2 size={14} />
                      Approve (let voter retry)
                    </button>

                    {/* Manual vote */}
                    <select
                      style={{
                        padding: "8px 12px",
                        borderRadius: 10,
                        border: "1px solid var(--border)",
                        fontSize: 13,
                        background: "var(--surface)",
                        color: "var(--text)",
                      }}
                      value={selectedCandidate[voter.voter_id] || ""}
                      onChange={(e) =>
                        setSelectedCandidate((prev) => ({
                          ...prev,
                          [voter.voter_id]: e.target.value,
                        }))
                      }
                    >
                      <option value="">Select candidate...</option>
                      {candidates.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.symbol} {c.name}
                        </option>
                      ))}
                    </select>

                    <button
                      className="button"
                      style={{ fontSize: 13, padding: "8px 16px", background: "var(--accent)" }}
                      onClick={() => handleManualVote(voter.voter_id)}
                      disabled={resolving === voter.voter_id}
                    >
                      <VoteIcon size={14} />
                      Cast manual vote
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── ALL VOTERS PANEL ───────────────────────────────── */}
      <div className="admin-panels" style={{ marginBottom: 24 }}>
        <div className="card admin-panel" style={{ gridColumn: "1 / -1" }}>
          <div className="card-header">
            <div>
              <h2 className="card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Users size={18} /> All Registered Voters
              </h2>
              <p className="card-subtitle">Flag any voter for manual review.</p>
            </div>
          </div>
          <div className="admin-list">
            {allVoters.length === 0 ? (
              <div className="admin-row"><span style={{ color: "var(--muted)" }}>No voters registered.</span></div>
            ) : allVoters.map((voter) => (
              <div key={voter.voter_id} className="admin-row" style={{ flexWrap: "wrap", gap: 8 }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <strong>{voter.full_name}</strong>
                  <span style={{ color: "var(--muted)", fontSize: 12, marginLeft: 8 }}>{voter.voter_id}</span>
                  <span style={{ color: "var(--muted)", fontSize: 12, marginLeft: 8 }}>{voter.cnic}</span>
                </div>
                <span className={`admin-pill ${voter.has_voted ? "success" : "neutral"}`}>
                  {voter.has_voted ? "Voted" : "Not voted"}
                </span>
                {voter.is_pending && <span className="admin-pill warning">Pending</span>}
                {!voter.is_pending && (
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                      placeholder="Reason (optional)"
                      style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid var(--border)", fontSize: 12, background: "var(--surface)", color: "var(--text)" }}
                      value={flagReason[voter.voter_id] || ""}
                      onChange={(e) => setFlagReason(prev => ({ ...prev, [voter.voter_id]: e.target.value }))}
                    />
                    <button
                      className="button"
                      style={{ fontSize: 12, padding: "6px 12px", background: "var(--warning)" }}
                      onClick={() => handleFlagVoter(voter.voter_id)}
                    >
                      Flag
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── EXISTING STATUS PANELS ───────────────────────── */}
      <div className="admin-panels">
        <div className="card admin-panel">
          <div className="card-header">
            <div>
              <h2 className="card-title">Operational status</h2>
              <p className="card-subtitle">All core services are reporting healthy.</p>
            </div>
            <span className="admin-pill success">Healthy</span>
          </div>
          <div className="admin-list">
            <div className="admin-row">
              <span>Identity verification</span>
              <span className="admin-pill success">Active</span>
            </div>
            <div className="admin-row">
              <span>Face recognition</span>
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
              <p className="card-subtitle">Current safeguards and audit checks.</p>
            </div>
            <span className="admin-pill neutral">Protected</span>
          </div>
          <div className="admin-list">
            <div className="admin-row">
              <span>Duplicate registration blocks</span>
              <span className="admin-pill success">Active</span>
            </div>
            <div className="admin-row">
              <span>Face recognition anti-fraud</span>
              <span className="admin-pill success">Active</span>
            </div>
            <div className="admin-row">
              <span>Receipt verification</span>
              <span className="admin-pill success">Active</span>
            </div>
            <div className="admin-row">
              <span>Fraud alerts</span>
              <span className={`admin-pill ${pendingVoters.length > 0 ? "warning" : "success"}`}>
                {pendingVoters.length} active
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminPage;
