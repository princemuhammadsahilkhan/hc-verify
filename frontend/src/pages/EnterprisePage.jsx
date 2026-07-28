import React, { useState } from "react";
import { 
  Globe, 
  ShieldCheck, 
  Link as LinkIcon, 
  Download, 
  Search, 
  CheckCircle,
  Activity,
  AlertTriangle
} from "lucide-react";
import toast from "react-hot-toast";

const EnterprisePage = () => {
  const [voteHash, setVoteHash] = useState("");
  const [timeline, setTimeline] = useState(null);
  const [merkleRoot, setMerkleRoot] = useState(null);
  const [officialId, setOfficialId] = useState("");
  
  const fetchMerkleRoot = async () => {
    try {
      const res = await fetch("http://localhost:8003/trust/merkle-root");
      const data = await res.json();
      if (res.ok) {
        setMerkleRoot(data.merkle_root);
        toast.success("Merkle Root Fetched from Trust Layer");
      } else {
        toast.error(data.message || "Failed to fetch Merkle Root");
      }
    } catch (e) {
      toast.error("Blockchain Trust Service Unreachable (Port 8003)");
    }
  };

  const fetchTimeline = async (e) => {
    e.preventDefault();
    if (!voteHash) return toast.error("Please enter a Vote Hash");
    try {
      const res = await fetch(`http://localhost:8005/verification/timeline/${voteHash}`);
      const data = await res.json();
      if (res.ok) {
        setTimeline(data.timeline);
        toast.success("Timeline Generated Successfully");
      } else {
        setTimeline(null);
        toast.error(data.detail || "Failed to generate timeline");
      }
    } catch (e) {
      toast.error("Advanced Verification Service Unreachable (Port 8005)");
    }
  };

  const downloadProof = () => {
    if (!voteHash) return toast.error("Please enter a Vote Hash");
    window.open(`http://localhost:8004/proofs/generate/${voteHash}`, "_blank");
  };

  const downloadCsv = () => {
    window.open(`http://localhost:8008/export/csv`, "_blank");
  };

  const submitShare = async (e) => {
    e.preventDefault();
    if (!officialId) return toast.error("Please enter Official ID");
    try {
      const res = await fetch("http://localhost:8001/security/submit-share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ official_id: officialId, share_token: "mock_token_123" })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setOfficialId("");
      } else {
        toast.error("Failed to submit share");
      }
    } catch (e) {
      toast.error("Threshold Security Service Unreachable (Port 8001)");
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: "40px auto", padding: "0 20px" }}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <h1 style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontSize: 32, color: "var(--text)" }}>
          <Globe size={36} color="var(--primary)" /> 
          Enterprise Control Center
        </h1>
        <p style={{ color: "var(--text-light)", fontSize: 18 }}>
          Decentralized verification, immutable proofs, and enterprise analytics.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
        
        {/* Blockchain Trust Card */}
        <div className="card" style={{ padding: 24, borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface)" }}>
          <h2 style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 20, marginBottom: 16 }}>
            <LinkIcon size={24} color="var(--primary)" /> Blockchain Trust Engine
          </h2>
          <p style={{ color: "var(--text-light)", marginBottom: 20, fontSize: 14 }}>
            Fetch the cryptographic Merkle Root of the entire election directly from the immutable ledger.
          </p>
          <button 
            onClick={fetchMerkleRoot}
            style={{ padding: "10px 16px", background: "var(--primary)", color: "white", border: "none", borderRadius: 8, cursor: "pointer", width: "100%", fontWeight: 600 }}
          >
            Fetch Merkle Root
          </button>
          {merkleRoot && (
            <div style={{ marginTop: 16, padding: 12, background: "rgba(37, 99, 235, 0.1)", borderRadius: 8, wordBreak: "break-all", fontSize: 12, fontFamily: "monospace" }}>
              <strong>Root Hash:</strong> {merkleRoot}
            </div>
          )}
        </div>

        {/* Verification & Proofs Card */}
        <div className="card" style={{ padding: 24, borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface)" }}>
          <h2 style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 20, marginBottom: 16 }}>
            <ShieldCheck size={24} color="#10b981" /> Verification & Proofs
          </h2>
          <p style={{ color: "var(--text-light)", marginBottom: 20, fontSize: 14 }}>
            Enter a Vote Hash to track its lifecycle or download a mathematical proof of inclusion.
          </p>
          <form onSubmit={fetchTimeline}>
            <input 
              type="text" 
              placeholder="Enter Vote Hash" 
              value={voteHash}
              onChange={e => setVoteHash(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)", marginBottom: 12 }}
            />
            <div style={{ display: "flex", gap: 10 }}>
              <button type="submit" style={{ flex: 1, padding: "10px", background: "var(--text)", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }}>
                <Search size={16} style={{ verticalAlign: "middle", marginRight: 6 }}/> Timeline
              </button>
              <button type="button" onClick={downloadProof} style={{ flex: 1, padding: "10px", background: "#10b981", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }}>
                <Download size={16} style={{ verticalAlign: "middle", marginRight: 6 }}/> JSON Proof
              </button>
            </div>
          </form>
          {timeline && (
            <div style={{ marginTop: 16 }}>
              <h4 style={{ marginBottom: 10 }}>Lifecycle Timeline:</h4>
              <ul style={{ paddingLeft: 20, fontSize: 13, color: "var(--text-light)" }}>
                {timeline.map((step, i) => (
                  <li key={i} style={{ marginBottom: 6 }}>
                    <strong>{step.stage}</strong> <br/>
                    <span style={{ fontSize: 11 }}>{step.layer} - {step.status}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Data & Analytics Card */}
        <div className="card" style={{ padding: 24, borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface)" }}>
          <h2 style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 20, marginBottom: 16 }}>
            <Activity size={24} color="#f59e0b" /> Transparency & Analytics
          </h2>
          <p style={{ color: "var(--text-light)", marginBottom: 20, fontSize: 14 }}>
            Access bulk data exports powered by the immutable enterprise ledger.
          </p>
          <button 
            onClick={downloadCsv}
            style={{ padding: "10px 16px", background: "#f59e0b", color: "white", border: "none", borderRadius: 8, cursor: "pointer", width: "100%", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            <Download size={18} /> Export Full Dataset (CSV)
          </button>
          
          <hr style={{ margin: "24px 0", border: "none", borderTop: "1px solid var(--border)" }} />
          
          <h2 style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 18, marginBottom: 12, color: "#ef4444" }}>
            <AlertTriangle size={20} /> Threshold Security Proxy
          </h2>
          <form onSubmit={submitShare} style={{ display: "flex", gap: 10 }}>
            <input 
              type="text" 
              placeholder="Official ID" 
              value={officialId}
              onChange={e => setOfficialId(e.target.value)}
              style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)" }}
            />
            <button type="submit" style={{ padding: "8px 16px", background: "#ef4444", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }}>
              Submit Share
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default EnterprisePage;
