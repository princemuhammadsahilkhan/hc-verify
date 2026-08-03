import React from 'react';
import { Edit, PlusCircle, Trash2, RefreshCw } from "lucide-react";

export default function AdminCandidatesTab({
  editingCandidate,
  candidateForm,
  handleCandidateChange,
  handleSaveCandidate,
  elections,
  showSymbolPicker,
  setShowSymbolPicker,
  setCandidateForm,
  candidateLoading,
  handleCancelEditCandidate,
  loadCandidates,
  candidates,
  handleEditCandidateClick,
  handleDeleteCandidate
}) {
  return (
    <div style={{ marginTop: 16, display: "grid", gap: 16 }}>
      <div className="card admin-panel">
        <div className="card-header">
          <div><h2 className="card-title">{editingCandidate ? <Edit size={16} /> : <PlusCircle size={16} />} {editingCandidate ? "Edit candidate" : "Add candidate"}</h2><p className="card-subtitle">{editingCandidate ? "Update the candidate details." : "Add a candidate using the new admin API."}</p></div>
        </div>
        <form className="form-grid" onSubmit={handleSaveCandidate}>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input className="input" name="name" value={candidateForm.name} onChange={handleCandidateChange} placeholder="e.g. Candidate Name" required />
          </div>
          <div className="form-group">
            <label className="form-label">Party</label>
            <input className="input" name="party" value={candidateForm.party} onChange={handleCandidateChange} placeholder="e.g. Independent / Party Name" required />
          </div>
          <div className="form-group">
            <label className="form-label">District</label>
            <input className="input" name="district" value={candidateForm.district} onChange={handleCandidateChange} placeholder="e.g. District 1 / Constituency" required />
          </div>
          <div className="form-group">
            <label className="form-label">Election (Optional)</label>
            <select className="input" name="election_id" value={candidateForm.election_id || ""} onChange={handleCandidateChange}>
              <option value="">All Elections (Universal)</option>
              {elections.map(e => (
                <option key={e.election_id} value={e.election_id}>{e.title}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ gridColumn: "1 / -1" }}>
            <label className="form-label">Symbol</label>
            <button type="button" className="input" onClick={() => setShowSymbolPicker(p => !p)} style={{ cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
              {candidateForm.symbol ? <span style={{ fontSize: 20 }}>{candidateForm.symbol}</span> : <span style={{ color: "var(--muted)" }}>Select a symbol...</span>}
            </button>
            {showSymbolPicker && (
              <div style={{ marginTop: 8, background: "var(--card-bg, #fff)", border: "1px solid var(--border)", borderRadius: 10, padding: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 6 }}>
                  {[
                    { emoji: "🦅", label: "Eagle" },
                    { emoji: "🐅", label: "Tiger" },
                    { emoji: "🦁", label: "Lion" },
                    { emoji: "🐘", label: "Elephant" },
                    { emoji: "🐎", label: "Horse" },
                    { emoji: "⚔️", label: "Sword" },
                    { emoji: "🏏", label: "Bat" },
                    { emoji: "🏹", label: "Arrow" },
                    { emoji: "⚖️", label: "Scale" },
                    { emoji: "🌙", label: "Crescent" },
                    { emoji: "⭐", label: "Star" },
                    { emoji: "🌳", label: "Tree" },
                    { emoji: "🔔", label: "Bell" },
                    { emoji: "📖", label: "Book" },
                    { emoji: "🕊️", label: "Dove" },
                    { emoji: "🏠", label: "House" },
                    { emoji: "🚜", label: "Tractor" },
                    { emoji: "✋", label: "Hand" },
                    { emoji: "🔑", label: "Key" },
                    { emoji: "🛡️", label: "Shield" },
                    { emoji: "⚡", label: "Lightning" },
                    { emoji: "🔥", label: "Flame" },
                    { emoji: "💎", label: "Diamond" },
                    { emoji: "🌾", label: "Wheat" },
                    { emoji: "☪️", label: "Moon & Star" },
                    { emoji: "🗳️", label: "Ballot Box" },
                    { emoji: "🏛️", label: "Parliament" },
                    { emoji: "🤝", label: "Handshake" },
                    { emoji: "🎯", label: "Target" },
                    { emoji: "🏆", label: "Trophy" }
                  ].map(s => (
                    <button key={s.label} type="button" onClick={() => { setCandidateForm(p => ({ ...p, symbol: s.emoji })); setShowSymbolPicker(false); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 10px", borderRadius: 8, border: candidateForm.symbol === s.emoji ? "2px solid #0f766e" : "1px solid var(--border)", background: candidateForm.symbol === s.emoji ? "rgba(15,118,110,0.08)" : "transparent", cursor: "pointer", fontSize: 13, fontWeight: 500, transition: "all 0.15s" }}>
                      <span style={{ fontSize: 18 }}>{s.emoji}</span> {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Unique Key <span style={{ color: "var(--muted)", fontWeight: 400 }}>(Duplicate Prevention)</span></label>
            <input className="input" name="unique_key" value={candidateForm.unique_key} onChange={handleCandidateChange} placeholder="e.g. CNIC / Bar License No / Unique ID" required />
          </div>
          <div className="form-actions" style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button className={`button${candidateLoading ? " is-loading" : ""}`} type="submit">{candidateLoading ? "Saving..." : editingCandidate ? "Update candidate" : "Add candidate"}</button>
            {editingCandidate && (
              <button type="button" className="button secondary" onClick={handleCancelEditCandidate}>Cancel</button>
            )}
            <span className="form-hint" style={{ marginLeft: "auto" }}>Uses {editingCandidate ? "PUT" : "POST"} /candidates.</span>
          </div>
        </form>
      </div>

      <div className="card admin-panel">
        <div className="card-header">
          <div><h2 className="card-title"><Trash2 size={16} /> Candidate list</h2><p className="card-subtitle">Delete candidates from the same panel.</p></div>
          <button className="button" style={{ fontSize: 12 }} onClick={loadCandidates}><RefreshCw size={13} /> Refresh</button>
        </div>
        <div className="admin-list">
          {candidates.length === 0 ? (
            <div className="admin-row"><span style={{ color: "var(--muted)" }}>No candidates available.</span></div>
          ) : candidates.map((candidate, idx) => (
            <div key={candidate.id || candidate.candidate_id || idx} className="admin-row" style={{ flexWrap: "wrap", gap: 8, alignItems: "center" }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(15,118,110,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                {candidate.symbol || candidate.symbol_name || "🗳️"}
              </div>
              <div style={{ flex: 1, minWidth: 180 }}>
                <strong>{candidate.name || candidate.full_name || candidate.candidate_name || candidate.title || "Candidate"}</strong>
                <span style={{ color: "var(--muted)", fontSize: 12, marginLeft: 8 }}>{candidate.party || candidate.party_name || ""}</span>
                <span style={{ color: "var(--muted)", fontSize: 12, marginLeft: 8 }}>{candidate.district || candidate.constituency || candidate.district_id || "-"}</span>
              </div>
              <span className="admin-pill neutral">Votes {candidate.votes ?? 0}</span>
              <button className="button secondary" style={{ fontSize: 12 }} onClick={() => handleEditCandidateClick(candidate)}>
                <Edit size={13} /> Edit
              </button>
              <button className="button secondary" style={{ fontSize: 12 }} onClick={() => handleDeleteCandidate(candidate.id || candidate.candidate_id)}>
                <Trash2 size={13} /> Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
