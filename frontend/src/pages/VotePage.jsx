import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  BadgeCheck,
  ShieldCheck,
  KeyRound,
  Vote as VoteIcon,
  ArrowRight,
  CheckCircle2
} from "lucide-react";
import toast from "react-hot-toast";

import API from "../api";


function VotePage() {

  const location = useLocation();
  const navigate = useNavigate();

  const [voterId, setVoterId] = useState("");

  const [authenticated, setAuthenticated] = useState(false);

  const [candidates, setCandidates] = useState([]);

  const [receipt, setReceipt] = useState(null);

  const [loading, setLoading] = useState(false);

  const [copyState, setCopyState] = useState({
    loading: false,
    error: "",
    success: false
  });

  useEffect(() => {
    const incomingVoterId = location.state?.voterId;
    if (incomingVoterId && !voterId) {
      setVoterId(incomingVoterId);
    }
  }, [location.state, voterId]);


  // =====================================
  // AUTHENTICATE
  // =====================================

  const authenticate = async () => {

    try {

      const response = await API.get(

        `/authenticate/${voterId}`
      );

      if (response.data.success) {

        setAuthenticated(true);

        loadCandidates();

      } else {

        toast.error(response.data.message || "Authentication failed");
      }

    } catch (error) {

      console.log(error);

      toast.error("Authentication failed. Please try again.");
    }
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

      const response = await API.post(

        "/vote",

        {

          voter_id: voterId,

          candidate_id: candidateId
        }
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
            Secure ballot
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
          Enter your voter ID to access the secure ballot interface.
        </p>
      </div>


      <div className="card form-card">

        <div className="form-group">

          <label className="form-label">
            Voter ID
          </label>

          <div className="input-wrap">
            <KeyRound size={16} />
            <input
              type="text"
              className="input"
              placeholder="HC-XXXXXX"
              value={voterId}
              onChange={(e) =>
                setVoterId(e.target.value)
              }
            />
          </div>
          <p className="helper-text">
            Use the ID issued during registration.
          </p>

        </div>


        <button
          className="button"
          onClick={authenticate}
        >
          Enter voting booth
          <BadgeCheck size={16} />
        </button>

      </div>

    </div>
  );
}

export default VotePage;