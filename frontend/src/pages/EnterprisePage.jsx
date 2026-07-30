import React, { useState } from "react";
import { 
  Globe, 
  ShieldCheck, 
  Link as LinkIcon, 
  Download, 
  Search, 
  Activity,
  KeyRound,
  CheckCircle2,
  Lock,
  ArrowRight,
  Database
} from "lucide-react";
import toast from "react-hot-toast";

const EnterprisePage = () => {
  const [voteHash, setVoteHash] = useState("");
  const [timeline, setTimeline] = useState(null);
  const [merkleRoot, setMerkleRoot] = useState(null);
  const [officialId, setOfficialId] = useState("");
  const [loadingMerkle, setLoadingMerkle] = useState(false);
  const [loadingShare, setLoadingShare] = useState(false);
  
  const fetchMerkleRoot = async () => {
    setLoadingMerkle(true);
    try {
      const res = await fetch("http://localhost:8003/trust/merkle-root");
      const data = await res.json();
      if (res.ok) {
        setMerkleRoot(data.merkle_root);
        toast.success("Merkle root verified from trust engine");
      } else {
        toast.error(data.message || "Failed to fetch Merkle root");
      }
    } catch (e) {
      toast.error("Trust engine service offline (Port 8003)");
    } finally {
      setLoadingMerkle(false);
    }
  };

  const fetchTimeline = async (e) => {
    e.preventDefault();
    if (!voteHash.trim()) return toast.error("Enter a valid vote hash");
    try {
      const res = await fetch(`http://localhost:8005/verification/timeline/${voteHash.trim()}`);
      const data = await res.json();
      if (res.ok) {
        setTimeline(data.timeline);
        toast.success("Verification timeline loaded");
      } else {
        setTimeline(null);
        toast.error(data.detail || "Timeline generation failed");
      }
    } catch (e) {
      toast.error("Verification service offline (Port 8005)");
    }
  };

  const downloadProof = () => {
    if (!voteHash.trim()) return toast.error("Enter a valid vote hash");
    window.open(`http://localhost:8004/proofs/generate/${voteHash.trim()}`, "_blank");
  };

  const downloadCsv = () => {
    window.open(`http://localhost:8008/export/csv`, "_blank");
    toast.success("Export initiated");
  };

  const submitShare = async (e) => {
    e.preventDefault();
    if (!officialId.trim()) return toast.error("Enter official ID");
    setLoadingShare(true);
    try {
      const res = await fetch("http://localhost:8001/security/submit-share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ official_id: officialId.trim(), share_token: "token_share_verified" })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Key share authorized");
        setOfficialId("");
      } else {
        toast.error("Share submission rejected");
      }
    } catch (e) {
      toast.error("Threshold security service offline (Port 8001)");
    } finally {
      setLoadingShare(false);
    }
  };

  return (
    <div style={{ maxWidth: 1160, margin: "24px auto", padding: "0 16px" }}>
      
      {/* ── Page Header ── */}
      <div className="page-header" style={{ marginBottom: 28 }}>
        <div className="eyebrow">
          <Globe size={14} /> Enterprise Controls
        </div>
        <h1 className="section-title">Enterprise Operations Center</h1>
        <p className="section-subtitle">
          Cryptographic proof generation, ledger integrity verification, and compliance data pipelines.
        </p>
      </div>

      {/* ── KPI Summary Bar ── */}
      <div className="results-metrics" style={{ marginBottom: 28, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        <div className="metric-card" style={{ padding: "16px 20px" }}>
          <div className="metric-icon" style={{ background: "rgba(16, 185, 129, 0.12)", color: "#10b981" }}>
            <Activity size={18} />
          </div>
          <div>
            <p style={{ fontSize: 12, margin: 0, color: "var(--muted)" }}>Ledger Status</p>
            <h3 style={{ fontSize: 16, margin: "2px 0 0", color: "#10b981", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", display: "inline-block" }} /> Synchronized
            </h3>
          </div>
        </div>

        <div className="metric-card" style={{ padding: "16px 20px" }}>
          <div className="metric-icon" style={{ background: "rgba(59, 130, 246, 0.12)", color: "#3b82f6" }}>
            <LinkIcon size={18} />
          </div>
          <div>
            <p style={{ fontSize: 12, margin: 0, color: "var(--muted)" }}>Trust Engine</p>
            <h3 style={{ fontSize: 16, margin: "2px 0 0" }}>Merkle Active</h3>
          </div>
        </div>

        <div className="metric-card" style={{ padding: "16px 20px" }}>
          <div className="metric-icon" style={{ background: "rgba(168, 85, 247, 0.12)", color: "#a855f7" }}>
            <Lock size={18} />
          </div>
          <div>
            <p style={{ fontSize: 12, margin: 0, color: "var(--muted)" }}>Security Protocol</p>
            <h3 style={{ fontSize: 16, margin: "2px 0 0" }}>Shamir Threshold</h3>
          </div>
        </div>

        <div className="metric-card" style={{ padding: "16px 20px" }}>
          <div className="metric-icon" style={{ background: "rgba(245, 158, 11, 0.12)", color: "#f59e0b" }}>
            <Database size={18} />
          </div>
          <div>
            <p style={{ fontSize: 12, margin: 0, color: "var(--muted)" }}>Data Exports</p>
            <h3 style={{ fontSize: 16, margin: "2px 0 0" }}>Compliance Ready</h3>
          </div>
        </div>
      </div>

      {/* ── Clean 2x2 Grid of Enterprise Operations Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(480px, 1fr))", gap: 24 }}>
        
        {/* ── Card 1: Merkle Trust Engine ── */}
        <div className="card form-card" style={{ margin: 0 }}>
          <div className="card-header" style={{ marginBottom: 16 }}>
            <div>
              <h2 className="card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <LinkIcon size={18} color="var(--primary)" /> Merkle Trust Engine
              </h2>
              <p className="card-subtitle">Query cryptographic Merkle root from the immutable ledger</p>
            </div>
          </div>

          <button 
            className={`button${loadingMerkle ? " is-loading" : ""}`}
            onClick={fetchMerkleRoot}
            disabled={loadingMerkle}
            style={{ width: "100%" }}
          >
            {loadingMerkle ? "Querying Ledger..." : "Fetch Election Merkle Root"}
            <ArrowRight size={16} />
          </button>

          {merkleRoot && (
            <div style={{ marginTop: 16, padding: "12px 14px", background: "rgba(59, 130, 246, 0.08)", borderRadius: 8, border: "1px solid rgba(59, 130, 246, 0.2)" }}>
              <span style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 4 }}>ACTIVE MERKLE ROOT HASH</span>
              <code style={{ fontSize: 12, fontFamily: "monospace", color: "var(--primary)", wordBreak: "break-all" }}>{merkleRoot}</code>
            </div>
          )}
        </div>

        {/* ── Card 2: Cryptographic Proof Generator ── */}
        <div className="card form-card" style={{ margin: 0 }}>
          <div className="card-header" style={{ marginBottom: 16 }}>
            <div>
              <h2 className="card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <ShieldCheck size={18} color="#10b981" /> Cryptographic Proof Generator
              </h2>
              <p className="card-subtitle">Generate proof of inclusion and audit timelines</p>
            </div>
          </div>

          <form onSubmit={fetchTimeline}>
            <div className="form-group" style={{ marginTop: 0, marginBottom: 14 }}>
              <div className="input-wrap">
                <Search size={16} />
                <input 
                  type="text" 
                  className="input"
                  placeholder="Enter Vote Hash (e.g. 0x8a92...)" 
                  value={voteHash}
                  onChange={e => setVoteHash(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button type="submit" className="button secondary" style={{ flex: 1 }}>
                <Search size={15} /> Audit Timeline
              </button>
              <button type="button" onClick={downloadProof} className="button" style={{ flex: 1, backgroundColor: "#10b981", borderColor: "#10b981" }}>
                <Download size={15} /> Export Proof JSON
              </button>
            </div>
          </form>

          {timeline && (
            <div style={{ marginTop: 16, padding: 12, background: "var(--background)", borderRadius: 8, border: "1px solid var(--border)" }}>
              <span style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 8 }}>INCLUSION TIMELINE STEPS:</span>
              <div style={{ display: "grid", gap: 8 }}>
                {timeline.map((step, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ fontWeight: 600 }}>{step.stage}</span>
                    <span style={{ color: "var(--muted)", fontSize: 11 }}>{step.layer} • <span style={{ color: "#10b981" }}>{step.status}</span></span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Card 3: Enterprise Data Pipeline ── */}
        <div className="card form-card" style={{ margin: 0 }}>
          <div className="card-header" style={{ marginBottom: 16 }}>
            <div>
              <h2 className="card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Database size={18} color="#f59e0b" /> Enterprise Data Pipeline
              </h2>
              <p className="card-subtitle">Download audit-ready datasets from the public ledger</p>
            </div>
          </div>

          <button 
            onClick={downloadCsv}
            className="button secondary"
            style={{ width: "100%", justifyContent: "center" }}
          >
            <Download size={16} /> Export Full Audit Dataset (CSV)
          </button>
        </div>

        {/* ── Card 4: Threshold Security Proxy ── */}
        <div className="card form-card" style={{ margin: 0 }}>
          <div className="card-header" style={{ marginBottom: 16 }}>
            <div>
              <h2 className="card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <KeyRound size={18} color="#ef4444" /> Threshold Security Control
              </h2>
              <p className="card-subtitle">Submit key share for multi-party authority authorization</p>
            </div>
          </div>

          <form onSubmit={submitShare}>
            <div className="form-group" style={{ marginTop: 0, marginBottom: 14 }}>
              <div className="input-wrap">
                <Lock size={16} />
                <input 
                  type="text" 
                  className="input"
                  placeholder="Enter Official Authority ID" 
                  value={officialId}
                  onChange={e => setOfficialId(e.target.value)}
                />
              </div>
            </div>

            <button 
              type="submit" 
              className={`button${loadingShare ? " is-loading" : ""}`}
              style={{ width: "100%", backgroundColor: "#ef4444", borderColor: "#ef4444" }}
              disabled={loadingShare}
            >
              <CheckCircle2 size={16} /> {loadingShare ? "Submitting..." : "Submit Key Share"}
            </button>
          </form>
        </div>

      </div>

    </div>
  );
};

export default EnterprisePage;
