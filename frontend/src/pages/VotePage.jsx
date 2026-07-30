import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  BadgeCheck,
  ShieldCheck,
  Vote as VoteIcon,
  ArrowRight,
  CheckCircle2
} from "lucide-react";
import toast from "react-hot-toast";

import API from "../api";
import { useLang } from "../context/LangContext";
import { QRCodeSVG } from "qrcode.react";

function VotePage() {

  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLang();
  const speak = () => {};
  // Speak page intro on load
  useEffect(() => {
    setTimeout(() => speak(t.voteTitle + ". " + t.voteSubtitle), 500);
  }, [t]);

  const [voter, setVoter] = useState(null);

  const [authenticated, setAuthenticated] = useState(false);

  const [candidates, setCandidates] = useState([]);

  const [receipt, setReceipt] = useState(null);

  const [loading, setLoading] = useState(false);

  const [copyState, setCopyState] = useState({
    loading: false,
    error: "",
    success: false
  });

  const [directVoterId, setDirectVoterId] = useState(
    location.state?.voterId || ""
  );

  const [districtModal, setDistrictModal] = useState({
    open: false,
    candidate: null,
    voterDistrict: "",
    candidateDistrict: ""
  });

  useEffect(() => {
    const passedVoterId = location.state?.voterId || "";
    if (passedVoterId) {
      setDirectVoterId(passedVoterId);
      setAuthenticated(true);
    }

    const token = localStorage.getItem("voterToken");
    if (token) {
      const loadSession = async () => {
        try {
          const response = await API.get("/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
          });

          setVoter(response.data);
          setAuthenticated(true);
          setDirectVoterId((prev) => prev || response.data.voter_id || "");
          await loadCandidates(response.data.district, response.data.voter_id || passedVoterId);
        } catch (error) {
          if (!passedVoterId) {
            localStorage.removeItem("voterToken");
            setAuthenticated(false);
            setVoter(null);
          } else {
            await loadCandidates(null, passedVoterId);
          }
        }
      };

      loadSession();
    } else if (passedVoterId) {
      loadCandidates(null, passedVoterId);
    }
  }, []);


  // =====================================
  // AUTHENTICATE
  // =====================================

  const authenticate = () => {
    navigate("/auth");
  };




  // =====================================
  // LOAD CANDIDATES
  // =====================================

  const loadCandidates = async (userDistrict, paramVoterId) => {
    try {
      setLoading(true);
      let url = "/candidates";
      let queryParams = [];
      if (userDistrict) {
        queryParams.push(`district=${encodeURIComponent(userDistrict)}`);
      }
      const targetVoterId = paramVoterId || directVoterId;
      if (targetVoterId) {
        queryParams.push(`voter_id=${encodeURIComponent(targetVoterId)}`);
      }
      if (queryParams.length > 0) {
        url += "?" + queryParams.join("&");
      }
      let response = await API.get(url);
      let list = Array.isArray(response.data) ? response.data : (response.data?.records || []);
      
      if (list.length === 0 && userDistrict) {
        // Fallback to fetch all candidates if district query returned empty
        const fallbackRes = await API.get("/candidates");
        list = Array.isArray(fallbackRes.data) ? fallbackRes.data : (fallbackRes.data?.records || []);
      }
      setCandidates(list);
    } catch (e) {
      console.error("Load Candidates error:", e);
    } finally {
      setLoading(false);
    }
  };


  // =====================================
  // CAST VOTE
  // =====================================

  const castVote = async (candidateId) => {
    if (loading) return;
    try {
      setLoading(true);

      const resolvedCandidateId = candidateId || "";
      if (!resolvedCandidateId) {
        toast.error("Invalid candidate selected. Please refresh and try again.");
        return;
      }

      const token = localStorage.getItem("voterToken");
      if (!token && !directVoterId) {
        toast.error("Please log in to vote.");
        navigate("/auth");
        return;
      }

      const votePayload = {
        candidate_id: resolvedCandidateId,
        voter_id: directVoterId || voter?.voter_id
      };

      const response = await API.post(
        "/vote",
        votePayload,
        token
          ? {
              headers: { Authorization: `Bearer ${token}` },
            }
          : undefined
      );

      if (response.data && (response.data.success === false || !response.data.receipt_code)) {
        toast.error(response.data.message || response.data.detail || "Voting failed. Please try again.");
        return;
      }

      setReceipt(response.data);
      if (voter) {
        setVoter({ ...voter, has_voted: true });
      }
      setCopyState({
        loading: false,
        error: "",
        success: false
      });
      toast.success("Vote cast successfully");
    } catch (error) {
      console.error("Cast Vote Error:", error);
      const errMsg = error.response?.data?.detail || error.response?.data?.message || "Voting failed. Please try again.";
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };


  const handleCopyReceipt = async () => {
    if (!receipt?.receipt_code || copyState.loading) return;

    setCopyState({ loading: true, error: "", success: false });

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(receipt.receipt_code);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = receipt.receipt_code;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopyState({ loading: false, error: "", success: true });
      toast.success("Receipt copied to clipboard");
      setTimeout(() => {
        navigate("/verify", { state: { receiptCode: receipt.receipt_code } });
      }, 1000);
    } catch (e) {
      console.error(e);
      setCopyState({ loading: false, error: "Failed to copy automatically", success: false });
    }
  };

  // =====================================
  // RECEIPT SCREEN
  // =====================================

  if (receipt && receipt.receipt_code) {
    return (
      <div className="page">
        <div className="card form-card">
          <div className="result-header">
            <CheckCircle2 size={20} />
            <h1 className="section-title">Vote confirmed</h1>
          </div>

          <p className="section-subtitle">
            Your ballot is encrypted, recorded, and notarized on the public ledger.
          </p>

          <div className="card result-card">
            <h2>Selected candidate</h2>
            <div className="candidate-picked">
              <span className="candidate-symbol">{receipt.candidate_symbol || "🗳️"}</span>
              <span>{receipt.candidate_name || "Selected Candidate"}</span>
            </div>
          </div>

          <div className="card result-card">
            <h3>Verification receipt</h3>
            <div className="receipt-box">{receipt.receipt_code}</div>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
              <div style={{ background: 'white', padding: '12px', borderRadius: '8px' }}>
                <QRCodeSVG
                  value={`${window.location.origin}/verify-public?code=${receipt.receipt_code}`}
                  size={140}
                  bgColor={"#ffffff"}
                  fgColor={"#000000"}
                  level={"Q"}
                  includeMargin={false}
                />
              </div>
            </div>

            <div className="form-actions" style={{ marginTop: 16 }}>
              <button
                className={`button${copyState.loading ? " is-loading" : ""}`}
                onClick={handleCopyReceipt}
              >
                {copyState.loading ? "Copying..." : copyState.success ? "Copied! Redirecting..." : "Copy verification code"}
              </button>

              <span className="form-hint">
                Copy your verification code to verify your vote on the public ledger.
              </span>
            </div>

            {copyState.error && (
              <div style={{ marginTop: 16, textAlign: 'center' }}>
                <p className="helper-text" style={{ color: 'var(--error)' }}>
                  {copyState.error}
                </p>
                <button
                  className="button"
                  style={{ marginTop: 8 }}
                  onClick={() => navigate("/verify", { state: { receiptCode: receipt.receipt_code } })}
                >
                  Continue to Verification
                </button>
              </div>
            )}

            <p className="helper-text">
              Keep this receipt to verify your vote later.
            </p>
          </div>

          <div className="notice">
            Verification confirms your vote exists but never reveals the candidate you selected.
          </div>
        </div>
      </div>
    );
  }

  // =====================================
  // ALREADY VOTED SCREEN
  // =====================================

  if (voter?.has_voted && !receipt) {
    return (
      <div className="page">
        <div className="card form-card" style={{ textAlign: "center", padding: "40px 24px" }}>
          <div style={{ display: "flex", justifyContent: "center", color: "var(--success)", marginBottom: 16 }}>
            <CheckCircle2 size={48} />
          </div>
          <h1 className="section-title">Ballot Already Submitted</h1>
          <p className="section-subtitle" style={{ maxWidth: 480, margin: "8px auto 24px" }}>
            Your vote has been cryptographically signed, encrypted, and recorded on the public ledger. Multiple ballots are prohibited by election rules.
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="button" onClick={() => navigate("/verify")}>
              <BadgeCheck size={16} /> Verify Vote Receipt
            </button>
            <button className="button secondary" onClick={() => navigate("/results")}>
              View Election Results
            </button>
          </div>
        </div>
      </div>
    );
  }




  const handleVoteAttempt = (candidate) => {
    const voterDistrict = voter?.district || voter?.constituency || location.state?.voterDistrict || "";
    const candDistrict = candidate.district || candidate.constituency || "";

    if (
      voterDistrict &&
      candDistrict &&
      voterDistrict.trim().toLowerCase() !== candDistrict.trim().toLowerCase() &&
      voterDistrict.trim().toLowerCase() !== "general" &&
      candDistrict.trim().toLowerCase() !== "general"
    ) {
      setDistrictModal({
        open: true,
        candidate,
        voterDistrict: voterDistrict.trim(),
        candidateDistrict: candDistrict.trim()
      });
      return;
    }

    const candId = candidate.id || candidate.candidate_id || candidate._id;
    castVote(candId);
  };


  // =====================================
  // BALLOT SCREEN
  // =====================================

  if (authenticated) {

    return (

      <div className="page">

        <div className="page-header">
          <div className="eyebrow">
            <VoteIcon size={16} />
            {t.voteTitle}
          </div>
          <h1 className="section-title">
            Cast your vote
          </h1>
          <p className="section-subtitle">
            Each ballot is anonymous, verifiable, and protected by a
            cryptographic receipt.
          </p>
        </div>


        {loading ? (
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <div className="loading-bar" style={{ maxWidth: 300, margin: '0 auto 12px' }} />
            <div className="loading-bar" style={{ maxWidth: 200, margin: '0 auto' }} />
            <p className="helper-text" style={{ marginTop: 16 }}>Loading official candidates for your district...</p>
          </div>
        ) : candidates.length === 0 ? (
          <div className="card form-card" style={{ textAlign: 'center', padding: '40px 24px' }}>
            <VoteIcon size={40} style={{ color: 'var(--muted)', marginBottom: 16 }} />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 8 }}>No Candidates Registered Yet</h2>
            <p className="helper-text" style={{ marginBottom: 24 }}>
              There are currently no active candidates registered for your district. Please check back shortly or select another district.
            </p>
            <button className="button" onClick={() => loadCandidates(voter?.district || location.state?.voterDistrict, directVoterId)}>
              Refresh Candidates
            </button>
          </div>
        ) : (
          <div className="candidate-grid">
            {candidates.map((candidate) => (
              <div key={candidate.id || candidate.candidate_id} className="candidate-card">
                <div className="candidate-symbol">{candidate.symbol || candidate.symbol_name || "🗳️"}</div>
                <h2>{candidate.name || candidate.full_name}</h2>
                <p>{candidate.party || candidate.party_name || "Independent"}</p>
                {(candidate.district || candidate.constituency) && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #94a3b8)', marginBottom: '12px', display: 'block' }}>
                    District: {candidate.district || candidate.constituency}
                  </span>
                )}

                <button
                  className={`button${loading ? " is-loading" : ""}`}
                  disabled={loading}
                  onClick={() => handleVoteAttempt(candidate)}
                >
                  {loading ? (
                    <>
                      <span className="spinner" />
                      Submitting...
                    </>
                  ) : (
                    "Submit vote"
                  )}
                  <ArrowRight size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {districtModal.open && districtModal.candidate && (
          <div className="modal-overlay" style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}>
            <div className="card form-card" style={{ maxWidth: '480px', width: '100%', textAlign: 'center', border: '1px solid #f59e0b' }}>
              <div style={{ display: 'flex', justifyContent: 'center', color: '#f59e0b', marginBottom: '12px' }}>
                <ShieldCheck size={48} />
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px' }}>
                District Mismatch Warning
              </h2>
              <p style={{ color: 'var(--text-secondary, #94a3b8)', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '20px' }}>
                You are registered in district <strong>"{districtModal.voterDistrict}"</strong>, but candidate <strong>"{districtModal.candidate.name}"</strong> belongs to district <strong>"{districtModal.candidateDistrict}"</strong>.
              </p>

              <div style={{
                background: 'rgba(245, 158, 11, 0.1)',
                borderLeft: '4px solid #f59e0b',
                padding: '12px',
                borderRadius: '4px',
                fontSize: '0.875rem',
                textAlign: 'left',
                marginBottom: '24px'
              }}>
                ⚠️ Voting for a candidate outside your assigned district is not permitted by election rules.
              </div>

              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button
                  className="button"
                  style={{ width: '100%', padding: '12px', backgroundColor: '#475569', borderColor: '#475569' }}
                  onClick={() => setDistrictModal({ open: false, candidate: null, voterDistrict: "", candidateDistrict: "" })}
                >
                  Cancel & Go Back
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }




  // =====================================
  // LOGIN SCREEN
  // =====================================

  return (

    <div className="page">

      <div className="page-header">
        <div className="eyebrow">
          <ShieldCheck size={16} />
          Identity check
        </div>
        <h1 className="section-title">
          Voter authentication
        </h1>
        <p className="section-subtitle">
          Sign in with your voter account to access the secure ballot interface.
        </p>
      </div>


      <div className="card form-card">
        <p className="helper-text" style={{ marginBottom: 16 }}>
          You need an active voter session to continue.
        </p>

        <div className="form-actions">
          <button
            className="button"
            onClick={authenticate}
          >
            Go to login
            <BadgeCheck size={16} />
          </button>
        </div>

        {voter && (
          <div className="admin-list" style={{ marginTop: 18 }}>
            <div className="admin-row"><span>Name</span><strong>{voter.full_name}</strong></div>
            <div className="admin-row"><span>Email</span><strong>{voter.email}</strong></div>
            <div className="admin-row"><span>District</span><strong>{voter.district || "-"}</strong></div>
          </div>
        )}

      </div>

    </div>
  );
}

export default VotePage;