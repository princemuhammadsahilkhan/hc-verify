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

  useEffect(() => {
    if (location.state?.voterId) {
      setDirectVoterId(location.state.voterId);
      setAuthenticated(true);
      loadCandidates();
      return;
    }

    const token = localStorage.getItem("voterToken");
    if (!token) {
      return;
    }

    const loadSession = async () => {
      try {
        const response = await API.get("/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setVoter(response.data);
        setAuthenticated(true);
        setDirectVoterId(response.data.voter_id || "");
        await loadCandidates();
      } catch (error) {
        localStorage.removeItem("voterToken");
        setAuthenticated(false);
        setVoter(null);
      }
    };

    loadSession();
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

  const loadCandidates = async () => {

    const response = await API.get(
      "/candidates"
    );

    setCandidates(response.data);
  };


  // =====================================
  // CAST VOTE
  // =====================================

  const castVote = async (candidateId) => {

    try {

      setLoading(true);

      const token = localStorage.getItem("voterToken");
      if (!token && !directVoterId) {
        toast.error("Please log in to vote.");
        navigate("/auth");
        return;
      }

      const votePayload = {
        candidate_id: candidateId
      };

      if (!token && directVoterId) {
        votePayload.voter_id = directVoterId;
      }
      const response = await API.post(

        "/vote",

        votePayload,
        token
          ? {
              headers: { Authorization: `Bearer ${token}` },
            }
          : undefined
      );

      setReceipt(response.data);

      setCopyState({
        loading: false,
        error: "",
        success: false
      });

      toast.success("Vote cast successfully");

    } catch (error) {

      console.log(error);

      toast.error("Voting failed. Please try again.");

    } finally {

      setLoading(false);
    }
  };


  const handleCopyReceipt = async () => {

    if (!receipt?.receipt_code || copyState.loading) {
      return;
    }

    setCopyState({
      loading: true,
      error: "",
      success: false
    });

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard access unavailable");
      }

      await navigator.clipboard.writeText(receipt.receipt_code);

      setCopyState({
        loading: false,
        error: "",
        success: true
      });

      setTimeout(() => {
        navigate("/verify", {
          state: {
            receiptCode: receipt.receipt_code
          }
        });
      }, 500);

    } catch (error) {

      console.log(error);

      setCopyState({
        loading: false,
        error: "Copy failed. Please copy the code manually.",
        success: false
      });
    }
  };


  // =====================================
  // RECEIPT SCREEN
  // =====================================

  if (receipt) {

    return (

      <div className="page">

        <div className="card form-card">

          <div className="result-header">
            <CheckCircle2 size={20} />
            <h1 className="section-title">Vote confirmed</h1>
          </div>

          <p className="section-subtitle">
            Your ballot is encrypted, recorded, and notarized on the public
            ledger.
          </p>

          <div className="card result-card">

            <h2>
              Selected candidate
            </h2>

            <div className="candidate-picked">
              <span className="candidate-symbol">
                {receipt.candidate_symbol}
              </span>
              <span>{receipt.candidate_name}</span>
            </div>

          </div>


          <div className="card result-card">

            <h3>
              Verification receipt
            </h3>

            <div className="receipt-box">
              {receipt.receipt_code}
            </div>

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
                {
                  copyState.loading
                    ? (
                      <>
                        <span className="spinner" />
                        Copying...
                      </>
                    )
                    : copyState.success
                      ? "Copied! Redirecting..."
                      : "Copy verification code"
                }
              </button>
              <span className="form-hint">
                Copy the code to verify your vote next.
              </span>
            </div>

            {copyState.error && (
              <p className="helper-text" style={{ marginTop: 8 }}>
                {copyState.error}
              </p>
            )}

            <p className="helper-text">
              Keep this receipt to verify your vote later.
            </p>

          </div>


          <div className="notice">
            Verification confirms your vote exists but never reveals the
            candidate you selected.
          </div>

        </div>

      </div>
    );
  }


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


        <div className="candidate-grid">

          {

            candidates.map((candidate) => (

              <div
                key={candidate.id}
                className="candidate-card"
              >

                <div className="candidate-symbol">

                  {candidate.symbol}

                </div>

                <h2>

                  {candidate.name}

                </h2>

                <p>

                  {candidate.party}

                </p>

                <button
                  className={`button${loading ? " is-loading" : ""}`}
                  onClick={() =>
                    castVote(candidate.id)
                  }
                >
                  {
                    loading
                      ? (
                        <>
                          <span className="spinner" />
                          Submitting...
                        </>
                      )
                      : "Submit vote"
                  }
                  <ArrowRight size={16} />
                </button>

              </div>

            ))

          }

        </div>

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