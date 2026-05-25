import { useEffect, useState } from "react";
import {
  ShieldCheck, Users, Vote as VoteIcon, Activity, AlertTriangle,
  UserX, CheckCircle2, Database, Terminal, Globe, Lock, RefreshCw
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import API from "../api";

const TABS = ["Dashboard", "Voters", "Pending", "API Explorer", "System"];

function AdminPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("Dashboard");
  const [stats, setStats] = useState({ total_voters: 0, votes_cast: 0, turnout: 0, pending: 0 });
  const [allVoters, setAllVoters] = useState([]);
  const [flagReason, setFlagReason] = useState({});
  const [pendingVoters, setPendingVoters] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [resolving, setResolving] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState({});
  const [apiResponse, setApiResponse] = useState("");
  const [apiLoading, setApiLoading] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState("");

  const token = localStorage.getItem("adminToken");
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    loadStats(); loadPendingVoters(); loadCandidates(); loadAllVoters();
  }, []);

  const loadStats = async () => {
    try { const res = await API.get("/admin/stats", authHeader); setStats(res.data); } catch (err) {}
  };
  const loadAllVoters = async () => {
    try { const res = await API.get("/admin/voters", authHeader); setAllVoters(res.data); } catch (err) {}
  };
  const loadPendingVoters = async () => {
    try { const res = await API.get("/admin/pending-voters", authHeader); setPendingVoters(res.data); } catch (err) {}
  };
  const loadCandidates = async () => {
    try { const res = await API.get("/candidates"); setCandidates(res.data); } catch (err) {}
  };

  const handleApprove = async (voterId) => {
    setResolving(voterId);
    try {
      await API.post(`/admin/resolve-pending/${voterId}`, { action: "approve" }, authHeader);
      toast.success("Voter approved"); loadPendingVoters(); loadStats();
    } catch { toast.error("Failed"); } finally { setResolving(null); }
  };

  const handleManualVote = async (voterId) => {
    const candidateId = selectedCandidate[voterId];
    if (!candidateId) { toast.error("Select a candidate first"); return; }
    setResolving(voterId);
    try {
      const res = await API.post(`/admin/resolve-pending/${voterId}`, { action: "manual_vote", candidate_id: parseInt(candidateId) }, authHeader);
      toast.success(res.data.message); loadPendingVoters(); loadStats();
    } catch (err) { toast.error(err.response?.data?.detail || "Failed"); } finally { setResolving(null); }
  };

  const handleFlagVoter = async (voterId) => {
    const reason = flagReason[voterId] || "Flagged by admin";
    try {
      await API.post(`/admin/flag-voter/${voterId}`, { reason }, authHeader);
      toast.success("Voter flagged"); loadAllVoters(); loadPendingVoters(); loadStats();
    } catch { toast.error("Failed"); }
  };

  const handleLogout = () => { localStorage.removeItem("adminToken"); navigate("/admin-login", { replace: true }); };

  const ENDPOINTS = [
    { label: "GET /admin/stats", method: "GET", url: "/admin/stats", auth: true },
    { label: "GET /voters", method: "GET", url: "/voters", auth: false },
    { label: "GET /admin/voters", method: "GET", url: "/admin/voters", auth: true },
    { label: "GET /candidates", method: "GET", url: "/candidates", auth: false },
    { label: "GET /admin/pending-voters", method: "GET", url: "/admin/pending-voters", auth: true },
  ];

  const runEndpoint = async (ep) => {
    setApiLoading(true); setApiResponse("");
    try {
      const headers = ep.auth ? authHeader.headers : {};
      const res = await API.get(ep.url, { headers });
      setApiResponse(JSON.stringify(res.data, null, 2));
    } catch (err) {
      setApiResponse(JSON.stringify(err.response?.data || err.message, null, 2));
    } finally { setApiLoading(false); }
  };

  const tabStyle = (t) => ({
    padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer",
    background: tab === t ? "var(--primary, #185FA5)" : "transparent",
    color: tab === t ? "#fff" : "var(--text, inherit)",
    fontWeight: tab === t ? 600 : 400, fontSize: 13,
  });

  return (
    <div className="page">
      <div className="page-header admin-header">
        <div className="eyebrow"><ShieldCheck size={16} />Administration</div>
        <div className="admin-title-row">
          <h1 className="section-title">Election command center</h1>
          <span className="admin-pill success">Live</span>
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
          {TABS.map(t => <button key={t} style={tabStyle(t)} onClick={() => setTab(t)}>{t}</button>)}
          <button className="button secondary" style={{ marginLeft: "auto", fontSize: 13 }} onClick={handleLogout}>Log out</button>
        </div>
      </div>

      {/* ── DASHBOARD TAB ── */}
      {tab === "Dashboard" && (
        <>
          <div className="admin-grid">
            <div className="card admin-metric"><div className="metric-icon"><Users size={18} /></div><div><p>Total voters</p><h3>{stats.total_voters}</h3></div></div>
            <div className="card admin-metric"><div className="metric-icon"><VoteIcon size={18} /></div><div><p>Votes cast</p><h3>{stats.votes_cast}</h3></div></div>
            <div className="card admin-metric"><div className="metric-icon"><Activity size={18} /></div><div><p>Turnout</p><h3>{stats.turnout}%</h3></div></div>
            <div className="card admin-metric"><div className="metric-icon"><AlertTriangle size={18} /></div><div><p>Pending review</p><h3 style={{ color: stats.pending > 0 ? "var(--danger)" : "inherit" }}>{stats.pending}</h3></div></div>
          </div>
          <div className="admin-panels">
            <div className="card admin-panel">
              <div className="card-header"><div><h2 className="card-title">Operational status</h2><p className="card-subtitle">All core services reporting healthy.</p></div><span className="admin-pill success">Healthy</span></div>
              <div className="admin-list">
                {["Identity verification","Face recognition","Ballot ledger sync","Security monitoring","Rate limiting","Account lockout"].map(s => (
                  <div key={s} className="admin-row"><span>{s}</span><span className="admin-pill success">Active</span></div>
                ))}
              </div>
            </div>
            <div className="card admin-panel">
              <div className="card-header"><div><h2 className="card-title">Election integrity</h2><p className="card-subtitle">Current safeguards and audit checks.</p></div><span className="admin-pill neutral">Protected</span></div>
              <div className="admin-list">
                {["Duplicate registration blocks","Face recognition anti-fraud","Receipt verification","Input validation (CNIC/phone)","CORS lockdown","Audit logging"].map(s => (
                  <div key={s} className="admin-row"><span>{s}</span><span className="admin-pill success">Active</span></div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── VOTERS TAB ── */}
      {tab === "Voters" && (
        <div className="card admin-panel" style={{ marginTop: 16 }}>
          <div className="card-header">
            <div><h2 className="card-title"><Users size={16} /> All Registered Voters</h2><p className="card-subtitle">Flag any voter for manual review.</p></div>
            <button className="button" style={{ fontSize: 12 }} onClick={loadAllVoters}><RefreshCw size={13} /> Refresh</button>
          </div>
          <div className="admin-list">
            {allVoters.length === 0 ? <div className="admin-row"><span style={{ color: "var(--muted)" }}>No voters registered.</span></div>
            : allVoters.map(voter => (
              <div key={voter.voter_id} className="admin-row" style={{ flexWrap: "wrap", gap: 8 }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <strong>{voter.full_name}</strong>
                  <span style={{ color: "var(--muted)", fontSize: 12, marginLeft: 8 }}>{voter.voter_id}</span>
                  <span style={{ color: "var(--muted)", fontSize: 12, marginLeft: 8 }}>{voter.cnic}</span>
                  <span style={{ color: "var(--muted)", fontSize: 12, marginLeft: 8 }}>{voter.constituency}</span>
                </div>
                <span className={`admin-pill ${voter.has_voted ? "success" : "neutral"}`}>{voter.has_voted ? "Voted" : "Not voted"}</span>
                {voter.is_pending && <span className="admin-pill warning">Pending</span>}
                {!voter.is_pending && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <input placeholder="Reason" style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid var(--border)", fontSize: 12, background: "var(--surface)", color: "var(--text)", width: 140 }}
                      value={flagReason[voter.voter_id] || ""}
                      onChange={e => setFlagReason(p => ({ ...p, [voter.voter_id]: e.target.value }))} />
                    <button className="button" style={{ fontSize: 12, padding: "5px 12px" }} onClick={() => handleFlagVoter(voter.voter_id)}>Flag</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── PENDING TAB ── */}
      {tab === "Pending" && (
        <div className="card admin-panel" style={{ marginTop: 16 }}>
          <div className="card-header">
            <div><h2 className="card-title"><UserX size={16} /> Pending Investigation</h2><p className="card-subtitle">Voters flagged for face mismatch — require manual ballot processing.</p></div>
            <span className={`admin-pill ${pendingVoters.length > 0 ? "warning" : "success"}`}>{pendingVoters.length > 0 ? `${pendingVoters.length} pending` : "All clear"}</span>
          </div>
          {pendingVoters.length === 0
            ? <div className="admin-row"><span style={{ color: "var(--muted)" }}>No pending voters.</span><span className="admin-pill success">✓ Clear</span></div>
            : pendingVoters.map(voter => (
              <div key={voter.voter_id} style={{ borderBottom: "1px solid var(--border)", padding: "16px 0", display: "grid", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                  <div><strong>{voter.full_name}</strong><span style={{ color: "var(--muted)", marginLeft: 10, fontSize: 13 }}>{voter.voter_id}</span><span style={{ color: "var(--muted)", marginLeft: 10, fontSize: 13 }}>CNIC: {voter.cnic}</span></div>
                  <span className="admin-pill warning">Flagged</span>
                </div>
                <div style={{ fontSize: 13, color: "var(--muted)" }}>{voter.pending_reason}</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <button className="button" style={{ fontSize: 13 }} onClick={() => handleApprove(voter.voter_id)} disabled={resolving === voter.voter_id}><CheckCircle2 size={13} /> Approve</button>
                  <select style={{ padding: "7px 12px", borderRadius: 10, border: "1px solid var(--border)", fontSize: 13, background: "var(--surface)", color: "var(--text)" }}
                    value={selectedCandidate[voter.voter_id] || ""}
                    onChange={e => setSelectedCandidate(p => ({ ...p, [voter.voter_id]: e.target.value }))}>
                    <option value="">Select candidate...</option>
                    {candidates.map(c => <option key={c.id} value={c.id}>{c.symbol} {c.name}</option>)}
                  </select>
                  <button className="button" style={{ fontSize: 13 }} onClick={() => handleManualVote(voter.voter_id)} disabled={resolving === voter.voter_id}><VoteIcon size={13} /> Manual vote</button>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* ── API EXPLORER TAB ── */}
      {tab === "API Explorer" && (
        <div style={{ marginTop: 16, display: "grid", gap: 16 }}>
          <div className="card">
            <h2 className="card-title" style={{ marginBottom: 12 }}><Terminal size={16} /> API Explorer</h2>
            <p className="card-subtitle" style={{ marginBottom: 16 }}>Test backend endpoints directly from the admin panel.</p>
            <div style={{ display: "grid", gap: 8 }}>
              {ENDPOINTS.map(ep => (
                <div key={ep.url} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "var(--surface, #f8fafc)", borderRadius: 10, border: "1px solid var(--border)" }}>
                  <span style={{ background: ep.method === "GET" ? "#dcfce7" : "#dbeafe", color: ep.method === "GET" ? "#166534" : "#1e40af", fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6, fontFamily: "monospace" }}>{ep.method}</span>
                  <code style={{ flex: 1, fontSize: 13 }}>{ep.url}</code>
                  {ep.auth && <span style={{ fontSize: 11, color: "var(--muted)", display: "flex", alignItems: "center", gap: 4 }}><Lock size={11} />Auth</span>}
                  <button className="button" style={{ fontSize: 12, padding: "5px 12px" }} onClick={() => { setSelectedEndpoint(ep.label); runEndpoint(ep); }}>Run</button>
                </div>
              ))}
            </div>
          </div>
          {(apiLoading || apiResponse) && (
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <strong style={{ fontSize: 13 }}>{selectedEndpoint}</strong>
                {apiLoading && <span style={{ fontSize: 12, color: "var(--muted)" }}>Loading...</span>}
              </div>
              <pre style={{ background: "#0f172a", color: "#e2e8f0", padding: 16, borderRadius: 10, fontSize: 12, overflow: "auto", maxHeight: 300, margin: 0 }}>
                {apiLoading ? "Fetching..." : apiResponse}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* ── SYSTEM TAB ── */}
      {tab === "System" && (
        <div style={{ marginTop: 16, display: "grid", gap: 16 }}>
          <div className="card">
            <h2 className="card-title" style={{ marginBottom: 16 }}><Database size={16} /> System Information</h2>
            <div className="admin-list">
              {[
                ["Backend", "FastAPI + Python"],
                ["Database", "SQLite (SQLAlchemy)"],
                ["Auth", "JWT (HS256)"],
                ["Face AI", "MediaPipe Face Mesh"],
                ["Liveness AI", "MediaPipe Pose"],
                ["Rate limiting", "5/min login, 3/min vote"],
                ["CORS", "Localhost locked"],
                ["Recovery", "3-layer system"],
              ].map(([k, v]) => (
                <div key={k} className="admin-row">
                  <span style={{ color: "var(--muted)", fontSize: 13 }}>{k}</span>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <h2 className="card-title" style={{ marginBottom: 16 }}><Globe size={16} /> API Endpoints</h2>
            <div className="admin-list">
              {[
                ["POST", "/register", "Register voter"],
                ["POST", "/admin/login", "Admin login"],
                ["GET", "/voters", "List voters"],
                ["GET", "/candidates", "List candidates"],
                ["POST", "/vote", "Cast vote"],
                ["GET", "/verify/{code}", "Verify receipt"],
                ["POST", "/register-face", "Save face embedding"],
                ["POST", "/check-face", "Check duplicate face"],
                ["GET", "/admin/stats", "Dashboard stats"],
                ["GET", "/admin/pending-voters", "Pending voters"],
                ["POST", "/admin/resolve-pending/{id}", "Resolve pending"],
                ["POST", "/admin/flag-voter/{id}", "Flag voter"],
                ["POST", "/admin/recover", "Recovery key reset"],
                ["POST", "/admin/request-reset", "Email reset"],
              ].map(([method, url, desc]) => (
                <div key={url} className="admin-row" style={{ gap: 10 }}>
                  <span style={{ background: method === "GET" ? "#dcfce7" : "#dbeafe", color: method === "GET" ? "#166534" : "#1e40af", fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 5, fontFamily: "monospace" }}>{method}</span>
                  <code style={{ fontSize: 12, flex: 1 }}>{url}</code>
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPage;
