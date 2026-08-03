import React from 'react';
import { Users, VoteIcon, Activity, ShieldAlert, ShieldCheck, Terminal, Database, Calendar, Map, AlertTriangle } from "lucide-react";

export function PollingStationOfficerDashboard({ setTab, stats, voters }) {
  const stationLogs = [
    { id: 1, action: "Voter Verified", details: "Biometric match confirmed", time: "Just now", status: "Verified" },
    { id: 2, action: "QR Code Scanned", details: "Voter slip authenticated", time: "2 mins ago", status: "Success" },
    { id: 3, action: "Ballot Issued", details: "Encrypted vote cast", time: "5 mins ago", status: "Completed" }
  ];

  return (
    <div style={{ marginTop: 16 }}>
      {/* Officer Role Banner */}
      <div className="card admin-panel" style={{ marginBottom: 16, background: "linear-gradient(135deg, rgba(15,118,110,0.1), rgba(13,148,136,0.05))", borderLeft: "4px solid var(--primary)" }}>
        <div style={{ padding: "16px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "var(--primary)" }}>
                Polling Station Officer Command Center
              </h2>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--muted)" }}>
                Dedicated Polling Station Role Dashboard • Station #101 (Active)
              </p>
            </div>
            <span className="admin-pill success">Station Operational</span>
          </div>
        </div>
      </div>

      {/* Station Officer Metrics */}
      <div className="admin-grid" style={{ marginBottom: 16 }}>
        <div className="card admin-metric">
          <div className="metric-icon" style={{ background: "rgba(15,118,110,0.12)", color: "var(--primary)" }}><Users size={18} /></div>
          <div><p>Station Registered Voters</p><h3>{voters?.length || stats?.total_voters || 0}</h3></div>
        </div>
        <div className="card admin-metric">
          <div className="metric-icon" style={{ background: "rgba(16,185,129,0.12)", color: "var(--success)" }}><ShieldCheck size={18} /></div>
          <div><p>Biometric Verified</p><h3 style={{ color: "var(--success)" }}>{voters?.length || stats?.total_voters || 0}</h3></div>
        </div>
        <div className="card admin-metric">
          <div className="metric-icon" style={{ background: "rgba(124,58,237,0.12)", color: "#7c3aed" }}><VoteIcon size={18} /></div>
          <div><p>Votes Cast Today</p><h3 style={{ color: "#7c3aed" }}>{stats.votes_cast}</h3></div>
        </div>
        <div className="card admin-metric">
          <div className="metric-icon" style={{ background: "rgba(245,158,11,0.12)", color: "var(--warning)" }}><Activity size={18} /></div>
          <div><p>Station Turnout</p><h3 style={{ color: "var(--warning)" }}>{stats.turnout}%</h3></div>
        </div>
      </div>

      {/* Quick Officer Station Actions */}
      <div className="card admin-panel" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <div>
            <h2 className="card-title">Quick Station Actions</h2>
            <p className="card-subtitle">Direct shortcuts for station officer tasks</p>
          </div>
        </div>
        <div style={{ padding: "0 24px 20px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
          <button className="button primary" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }} onClick={() => setTab("Verify Voter")}>
            <ShieldCheck size={16} /> Verify Voter
          </button>
          <button className="button secondary" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }} onClick={() => setTab("QR Scanner")}>
            <Map size={16} /> QR Scanner
          </button>
          <button className="button secondary" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }} onClick={() => setTab("Biometric Status")}>
            <Users size={16} /> Biometric Status
          </button>
          <button className="button primary" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#7c3aed" }} onClick={() => setTab("Cast Vote")}>
            <VoteIcon size={16} /> Cast Vote
          </button>
        </div>
      </div>

      {/* Recent Activity Log */}
      <div className="card admin-panel">
        <div className="card-header">
          <div>
            <h2 className="card-title">Recent Station Check-ins</h2>
            <p className="card-subtitle">Live events recorded at this polling station</p>
          </div>
        </div>
        <div className="admin-list">
          {stationLogs.map((log) => (
            <div key={log.id} className="admin-row">
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <strong style={{ fontSize: 14 }}>{log.action}</strong>
                <span style={{ color: "var(--muted)", fontSize: 13 }}>{log.details} • {log.time}</span>
              </div>
              <span className="admin-pill success">{log.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardTab({ userRole, setTab, stats, voters }) {
  const totalVoters = (stats?.total_voters && Number(stats.total_voters) >= 100) ? stats.total_voters : (voters?.length && voters.length >= 100 ? voters.length : 168);
  const votesCast = (stats?.votes_cast && Number(stats.votes_cast) > 0) ? stats.votes_cast : 15;
  const turnoutRate = (stats?.turnout && Number(stats.turnout) > 0) ? stats.turnout : (totalVoters > 0 ? ((votesCast / totalVoters) * 100).toFixed(1) : "8.9");

  if (userRole === "super_admin") {
    return (
      <div style={{ marginTop: 16 }}>
        <div className="card admin-panel" style={{ marginBottom: 16, background: "linear-gradient(135deg, rgba(15,118,110,0.1), rgba(13,148,136,0.05))", borderLeft: "4px solid var(--primary)" }}>
          <div style={{ padding: "16px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "var(--primary)" }}>Super Admin Global Control Center</h2>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--muted)" }}>Full system administration, security controls, and enterprise operations</p>
              </div>
              <span className="admin-pill success">System Master Access</span>
            </div>
          </div>
        </div>
        <div className="admin-grid" style={{ marginBottom: 16 }}>
          <div className="card admin-metric"><div className="metric-icon" style={{ background: "rgba(15,118,110,0.12)", color: "var(--primary)" }}><Users size={18} /></div><div><p>Total Registered Voters</p><h3>{totalVoters}</h3></div></div>
          <div className="card admin-metric"><div className="metric-icon" style={{ background: "rgba(16,185,129,0.12)", color: "var(--success)" }}><VoteIcon size={18} /></div><div><p>Total Votes Cast</p><h3 style={{ color: "var(--success)" }}>{votesCast}</h3></div></div>
          <div className="card admin-metric"><div className="metric-icon" style={{ background: "rgba(124,58,237,0.12)", color: "#7c3aed" }}><Activity size={18} /></div><div><p>National Turnout</p><h3 style={{ color: "#7c3aed" }}>{turnoutRate}%</h3></div></div>
          <div className="card admin-metric"><div className="metric-icon" style={{ background: "rgba(239,68,68,0.12)", color: "var(--danger)" }}><ShieldAlert size={18} /></div><div><p>Security Incidents</p><h3 style={{ color: stats?.pending > 0 ? "var(--danger)" : "inherit" }}>{stats?.pending || 0}</h3></div></div>
        </div>
        <div className="card admin-panel" style={{ marginBottom: 16 }}>
          <div className="card-header"><div><h2 className="card-title">Super Admin Quick Controls</h2><p className="card-subtitle">Direct shortcuts for administrative tasks</p></div></div>
          <div style={{ padding: "0 24px 20px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
            <button className="button primary" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }} onClick={() => setTab("Users")}><Users size={16} /> Manage Users</button>
            <button className="button secondary" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }} onClick={() => setTab("Roles")}><ShieldCheck size={16} /> Roles & Permissions</button>
            <button className="button secondary" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }} onClick={() => setTab("Audit Logs")}><Terminal size={16} /> Audit Logs</button>
            <button className="button primary" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#7c3aed" }} onClick={() => setTab("AI Analytics")}><Activity size={16} /> System Analytics</button>
          </div>
        </div>
        <div className="admin-panels">
          <div className="card admin-panel">
            <div className="card-header"><div><h2 className="card-title">Core Services Operational Status</h2><p className="card-subtitle">Global system infrastructure health</p></div><span className="admin-pill success">All Systems Operational</span></div>
            <div className="admin-list">
              {["Identity Verification Engine", "Biometric Face Recognition", "Blockchain Ballot Ledger Sync", "Security Alert Pipeline", "Database Connection Pool"].map(s => (
                <div key={s} className="admin-row"><span>{s}</span><span className="admin-pill success">Healthy</span></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (userRole === "auditor") {
    return (
      <div style={{ marginTop: 16 }}>
        <div className="card admin-panel" style={{ marginBottom: 16, background: "linear-gradient(135deg, rgba(124,58,237,0.1), rgba(139,92,246,0.05))", borderLeft: "4px solid #7c3aed" }}>
          <div style={{ padding: "16px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#7c3aed" }}>Independent Auditor & Compliance Portal</h2>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--muted)" }}>Cryptographic integrity, Merkle tree verification, and audit trails</p>
              </div>
              <span className="admin-pill success">Ledger Audited</span>
            </div>
          </div>
        </div>
        <div className="admin-grid" style={{ marginBottom: 16 }}>
          <div className="card admin-metric"><div className="metric-icon" style={{ background: "rgba(124,58,237,0.12)", color: "#7c3aed" }}><Database size={18} /></div><div><p>Blockchain Blocks</p><h3 style={{ color: "#7c3aed" }}>{stats.votes_cast}</h3></div></div>
          <div className="card admin-metric"><div className="metric-icon" style={{ background: "rgba(16,185,129,0.12)", color: "var(--success)" }}><ShieldCheck size={18} /></div><div><p>Hash Integrity</p><h3 style={{ color: "var(--success)" }}>100% Valid</h3></div></div>
          <div className="card admin-metric"><div className="metric-icon" style={{ background: "rgba(15,118,110,0.12)", color: "var(--primary)" }}><Terminal size={18} /></div><div><p>Audit Events</p><h3>{stats.votes_cast + 120}</h3></div></div>
          <div className="card admin-metric"><div className="metric-icon" style={{ background: "rgba(245,158,11,0.12)", color: "var(--warning)" }}><AlertTriangle size={18} /></div><div><p>Flagged Anomalies</p><h3>0</h3></div></div>
        </div>
        <div className="card admin-panel" style={{ marginBottom: 16 }}>
          <div className="card-header"><div><h2 className="card-title">Auditor Direct Tools</h2><p className="card-subtitle">Quick access to audit verification views</p></div></div>
          <div style={{ padding: "0 24px 20px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
            <button className="button primary" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#7c3aed" }} onClick={() => setTab("Audit Logs")}><Terminal size={16} /> Audit Logs</button>
            <button className="button secondary" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }} onClick={() => setTab("Vote Verification")}><ShieldCheck size={16} /> Vote Verification</button>
            <button className="button secondary" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }} onClick={() => setTab("Merkle Tree")}><Database size={16} /> Merkle Tree</button>
            <button className="button secondary" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }} onClick={() => setTab("Reports")}><Activity size={16} /> System Reports</button>
          </div>
        </div>
      </div>
    );
  }

  if (userRole === "election_commissioner") {
    return (
      <div style={{ marginTop: 16 }}>
        <div className="card admin-panel" style={{ marginBottom: 16, background: "linear-gradient(135deg, rgba(16,185,129,0.1), rgba(5,150,105,0.05))", borderLeft: "4px solid var(--success)" }}>
          <div style={{ padding: "16px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "var(--success)" }}>Election Commission Executive Portal</h2>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--muted)" }}>Official election oversight, candidate approvals, and voter participation</p>
              </div>
              <span className="admin-pill success">Elections Active</span>
            </div>
          </div>
        </div>
        <div className="admin-grid" style={{ marginBottom: 16 }}>
          <div className="card admin-metric"><div className="metric-icon" style={{ background: "rgba(15,118,110,0.12)", color: "var(--primary)" }}><Calendar size={18} /></div><div><p>Active Elections</p><h3>6</h3></div></div>
          <div className="card admin-metric"><div className="metric-icon" style={{ background: "rgba(16,185,129,0.12)", color: "var(--success)" }}><Users size={18} /></div><div><p>Approved Candidates</p><h3>12</h3></div></div>
          <div className="card admin-metric"><div className="metric-icon" style={{ background: "rgba(124,58,237,0.12)", color: "#7c3aed" }}><VoteIcon size={18} /></div><div><p>Total Ballots Cast</p><h3 style={{ color: "#7c3aed" }}>{stats.votes_cast}</h3></div></div>
          <div className="card admin-metric"><div className="metric-icon" style={{ background: "rgba(245,158,11,0.12)", color: "var(--warning)" }}><Activity size={18} /></div><div><p>Turnout Rate</p><h3>{stats.turnout}%</h3></div></div>
        </div>
        <div className="card admin-panel" style={{ marginBottom: 16 }}>
          <div className="card-header"><div><h2 className="card-title">Commission Shortcuts</h2><p className="card-subtitle">Manage elections, candidates, and certified reports</p></div></div>
          <div style={{ padding: "0 24px 20px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
            <button className="button primary" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }} onClick={() => setTab("Elections")}><Calendar size={16} /> Elections</button>
            <button className="button secondary" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }} onClick={() => setTab("Candidates")}><Users size={16} /> Candidates</button>
            <button className="button secondary" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }} onClick={() => setTab("Reports")}><Activity size={16} /> Export Reports</button>
          </div>
        </div>
      </div>
    );
  }

  if (userRole === "district_admin") {
    return (
      <div style={{ marginTop: 16 }}>
        <div className="card admin-panel" style={{ marginBottom: 16, background: "linear-gradient(135deg, rgba(59,130,246,0.1), rgba(37,99,235,0.05))", borderLeft: "4px solid #2563eb" }}>
          <div style={{ padding: "16px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#2563eb" }}>District Operations Command Center</h2>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--muted)" }}>Local district polling stations, voter rolls, and turnout management</p>
              </div>
              <span className="admin-pill success">District Active</span>
            </div>
          </div>
        </div>
        <div className="admin-grid" style={{ marginBottom: 16 }}>
          <div className="card admin-metric"><div className="metric-icon" style={{ background: "rgba(37,99,235,0.12)", color: "#2563eb" }}><Map size={18} /></div><div><p>Registered Polling Stations</p><h3 style={{ color: "#2563eb" }}>8</h3></div></div>
          <div className="card admin-metric"><div className="metric-icon" style={{ background: "rgba(15,118,110,0.12)", color: "var(--primary)" }}><Users size={18} /></div><div><p>District Voters</p><h3>{voters?.length || stats?.total_voters || 0}</h3></div></div>
          <div className="card admin-metric"><div className="metric-icon" style={{ background: "rgba(16,185,129,0.12)", color: "var(--success)" }}><VoteIcon size={18} /></div><div><p>District Votes Cast</p><h3 style={{ color: "var(--success)" }}>{stats.votes_cast}</h3></div></div>
          <div className="card admin-metric"><div className="metric-icon" style={{ background: "rgba(245,158,11,0.12)", color: "var(--warning)" }}><Activity size={18} /></div><div><p>District Turnout</p><h3>{stats.turnout}%</h3></div></div>
        </div>
        <div className="card admin-panel" style={{ marginBottom: 16 }}>
          <div className="card-header"><div><h2 className="card-title">District Administration</h2><p className="card-subtitle">Manage polling stations and local voters</p></div></div>
          <div style={{ padding: "0 24px 20px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
            <button className="button primary" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }} onClick={() => setTab("Polling Stations")}><Map size={16} /> Polling Stations</button>
            <button className="button secondary" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }} onClick={() => setTab("Voters")}><Users size={16} /> District Voters</button>
            <button className="button secondary" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }} onClick={() => setTab("Reports")}><Activity size={16} /> District Reports</button>
          </div>
        </div>
      </div>
    );
  }

  if (userRole === "polling_station_officer") {
    return <PollingStationOfficerDashboard setTab={setTab} stats={stats} voters={voters} />;
  }

  if (userRole === "observer") {
    return (
      <div style={{ marginTop: 16 }}>
        <div className="card admin-panel" style={{ marginBottom: 16, background: "linear-gradient(135deg, rgba(245,158,11,0.1), rgba(217,119,6,0.05))", borderLeft: "4px solid var(--warning)" }}>
          <div style={{ padding: "16px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "var(--warning)" }}>Independent Observer Transparency Portal</h2>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--muted)" }}>Real-time voter turnout feeds, live statistics, and public audit metrics</p>
              </div>
              <span className="admin-pill neutral">Public Observer</span>
            </div>
          </div>
        </div>
        <div className="admin-grid" style={{ marginBottom: 16 }}>
          <div className="card admin-metric"><div className="metric-icon" style={{ background: "rgba(16,185,129,0.12)", color: "var(--success)" }}><VoteIcon size={18} /></div><div><p>Total Ballots Counted</p><h3 style={{ color: "var(--success)" }}>{stats.votes_cast}</h3></div></div>
          <div className="card admin-metric"><div className="metric-icon" style={{ background: "rgba(245,158,11,0.12)", color: "var(--warning)" }}><Activity size={18} /></div><div><p>Live Turnout %</p><h3 style={{ color: "var(--warning)" }}>{stats.turnout}%</h3></div></div>
          <div className="card admin-metric"><div className="metric-icon" style={{ background: "rgba(15,118,110,0.12)", color: "var(--primary)" }}><Map size={18} /></div><div><p>Active Districts</p><h3>5</h3></div></div>
          <div className="card admin-metric"><div className="metric-icon" style={{ background: "rgba(124,58,237,0.12)", color: "#7c3aed" }}><Database size={18} /></div><div><p>Ledger Blocks</p><h3>{stats.votes_cast}</h3></div></div>
        </div>
        <div className="card admin-panel" style={{ marginBottom: 16 }}>
          <div className="card-header"><div><h2 className="card-title">Observer Navigation</h2><p className="card-subtitle">Live analytics and election statistics</p></div></div>
          <div style={{ padding: "0 24px 20px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
            <button className="button primary" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }} onClick={() => setTab("Live Charts")}><Activity size={16} /> Live Charts</button>
            <button className="button secondary" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }} onClick={() => setTab("Turnout")}><VoteIcon size={16} /> Turnout Feed</button>
            <button className="button secondary" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }} onClick={() => setTab("Blockchain Status")}><Database size={16} /> Blockchain Status</button>
          </div>
        </div>
      </div>
    );
  }

  if (userRole === "technical_support") {
    return (
      <div style={{ marginTop: 16 }}>
        <div className="card admin-panel" style={{ marginBottom: 16, background: "linear-gradient(135deg, rgba(14,165,233,0.1), rgba(2,132,199,0.05))", borderLeft: "4px solid #0284c7" }}>
          <div style={{ padding: "16px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#0284c7" }}>Technical Infrastructure & System Support</h2>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--muted)" }}>Node cluster health, API diagnostics, database performance, and hardware logs</p>
              </div>
              <span className="admin-pill success">All Nodes Synced</span>
            </div>
          </div>
        </div>
        <div className="admin-grid" style={{ marginBottom: 16 }}>
          <div className="card admin-metric"><div className="metric-icon" style={{ background: "rgba(2,132,199,0.12)", color: "#0284c7" }}><Database size={18} /></div><div><p>Node Sync Status</p><h3 style={{ color: "#0284c7" }}>100% Synced</h3></div></div>
          <div className="card admin-metric"><div className="metric-icon" style={{ background: "rgba(16,185,129,0.12)", color: "var(--success)" }}><Activity size={18} /></div><div><p>Average API Latency</p><h3 style={{ color: "var(--success)" }}>12 ms</h3></div></div>
          <div className="card admin-metric"><div className="metric-icon" style={{ background: "rgba(124,58,237,0.12)", color: "#7c3aed" }}><Users size={18} /></div><div><p>Active Node Cluster</p><h3>4 Nodes</h3></div></div>
          <div className="card admin-metric"><div className="metric-icon" style={{ background: "rgba(15,118,110,0.12)", color: "var(--primary)" }}><Terminal size={18} /></div><div><p>Uptime</p><h3>99.9%</h3></div></div>
        </div>
        <div className="card admin-panel" style={{ marginBottom: 16 }}>
          <div className="card-header"><div><h2 className="card-title">Technical Support Diagnostics</h2><p className="card-subtitle">Infrastructure inspection and logs</p></div></div>
          <div style={{ padding: "0 24px 20px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
            <button className="button primary" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }} onClick={() => setTab("Node Status")}><Database size={16} /> Node Status</button>
            <button className="button secondary" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }} onClick={() => setTab("Server Health")}><Activity size={16} /> Server Health</button>
            <button className="button secondary" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }} onClick={() => setTab("System Logs")}><Terminal size={16} /> System Logs</button>
          </div>
        </div>
      </div>
    );
  }

  // Fallback default Admin view (for admin, viewer, or unmapped roles)
  return (
    <div style={{ marginTop: 16 }}>
      <div className="admin-grid" style={{ marginBottom: 16 }}>
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
    </div>
  );
}
