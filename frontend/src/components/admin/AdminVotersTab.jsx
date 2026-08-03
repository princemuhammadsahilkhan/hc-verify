import React from 'react';
import { UserX, RefreshCw } from "lucide-react";

export default function AdminVotersTab({
  allVoters,
  loadAllVoters
}) {
  return (
    <div className="card admin-panel" style={{ marginTop: 16 }}>
      <div className="card-header">
        <div>
          <h2 className="card-title"><UserX size={16} /> Voter registry</h2>
          <p className="card-subtitle">Loaded from GET /admin/voters. Records found: {allVoters.length}</p>
        </div>
        <button className="button" style={{ fontSize: 12 }} onClick={loadAllVoters}><RefreshCw size={13} /> Refresh</button>
      </div>
      <div className="admin-list" style={{ marginTop: 16 }}>
        {allVoters.map((voter, idx) => (
          <div key={voter.voter_id || voter.id || idx} className="admin-row" style={{ flexWrap: "wrap", gap: 8 }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <strong>{voter.full_name || voter.name || voter.cnic || "Voter"}</strong>
              <span style={{ color: "var(--muted)", fontSize: 12, marginLeft: 8 }}>{voter.cnic || voter.bar_number || "-"}</span>
              <span style={{ color: "var(--muted)", fontSize: 12, marginLeft: 8 }}>{voter.constituency || voter.district || "-"}</span>
            </div>
            <span className={`admin-pill ${voter.has_voted ? "success" : "neutral"}`}>
              {voter.has_voted ? "Voted" : "Not voted"}
            </span>
            <span className={`admin-pill ${voter.is_pending ? "warning" : "success"}`}>
              {voter.is_pending ? "Pending" : "Clear"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
