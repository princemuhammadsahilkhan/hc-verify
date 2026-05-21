import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, UserPlus, IdCard, Phone, MapPin } from "lucide-react";

import API from "../api";
import { LivenessDetector } from "../services/livenessDetector";

// ─────────────────────────────────────────────────────────────
// Liveness steps config — matches the existing UI steps exactly
// step 0: start camera  (unchanged)
// step 1: align face    ← AI: face centered for N frames
// step 2: blink         ← AI: EAR blink detection
// step 3: head left     ← AI: yaw estimation
// step 4: head right    ← AI: yaw estimation
// step 5: raise hand    ← AI: pose wrist above shoulder
// ─────────────────────────────────────────────────────────────

const STEP_INSTRUCTIONS = {
  1: "Center your face in the frame and hold still.",
  2: "Blink once naturally.",
  3: "Slowly turn your head to the LEFT.",
  4: "Now turn your head to the RIGHT.",
  5: "Raise one hand above your shoulder.",
};

const TOTAL_AI_STEPS = 5; // steps 1–5

function RegisterPage() {

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: "",
    cnic: "",
    phone: "",
    constituency: ""
  });

  const [loading, setLoading] = useState(false);

  const [success, setSuccess] = useState("");

  const [voterId, setVoterId] = useState("");

  const [modal, setModal] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
    detail: ""
  });

  const [verification, setVerification] = useState({
    open: false,
    step: 0,
    checking: false,
    cameraReady: false,
    cameraError: "",
    // ── AI-specific state ──
    aiLoading: false,      // true while models are initialising
    aiError: "",           // model-load error message
    stepDone: false,       // brief "✓ detected" flash between steps
  });

  const [copyState, setCopyState] = useState({
    loading: false,
    error: "",
    success: false
  });

  const videoRef    = useRef(null);
  const streamRef   = useRef(null);
  const voterIdRef  = useRef(null);
  const detectorRef = useRef(null); // LivenessDetector instance


  // =====================================
  // VERIFICATION HELPERS  (unchanged API)
  // =====================================

  const openVerification = () => {
    setVerification({
      open: true,
      step: 0,
      checking: false,
      cameraReady: false,
      cameraError: "",
      aiLoading: false,
      aiError: "",
      stepDone: false,
    });
  };

  const closeVerification = useCallback(() => {
    // Tear down AI detector
    if (detectorRef.current) {
      detectorRef.current.destroy();
      detectorRef.current = null;
    }
    setVerification((prev) => ({
      ...prev,
      open: false,
    }));
  }, []);

  const requestCamera = async () => {
    setVerification((prev) => ({
      ...prev,
      checking: true,
      cameraError: "",
    }));

    if (!navigator.mediaDevices?.getUserMedia) {
      setVerification((prev) => ({
        ...prev,
        checking: false,
        cameraError: "Camera access is not supported in this browser.",
      }));
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise((res) => {
          videoRef.current.onloadedmetadata = res;
        });
      }

      // Camera is ready — now load AI models
      setVerification((prev) => ({
        ...prev,
        checking: false,
        cameraReady: true,
        step: 1,
        aiLoading: true,
        aiError: "",
      }));

      await startAIDetection(1);

    } catch (error) {
      console.error(error);
      setVerification((prev) => ({
        ...prev,
        checking: false,
        cameraError:
          "Camera permission was denied. You can still continue with demo verification.",
      }));
    }
  };

  // ─────────────────────────────────────────────────────────────
  // startAIDetection — creates LivenessDetector, starts at `step`
  // ─────────────────────────────────────────────────────────────

  const startAIDetection = async (initialStep) => {
    if (!videoRef.current) return;

    // Destroy any previous detector
    if (detectorRef.current) {
      detectorRef.current.destroy();
      detectorRef.current = null;
    }

    const detector = new LivenessDetector(
      videoRef.current,
      null, // no canvas needed (detection only, no overlay drawing)

      // onStepComplete callback — called by detector when action detected
      (completedStep) => {
        setVerification((prev) => ({
          ...prev,
          stepDone: true,
        }));

        // Brief "detected!" flash, then advance
        setTimeout(() => {
          const nextStep = completedStep + 1;

          if (nextStep > TOTAL_AI_STEPS) {
            // All AI steps done — run registration
            setVerification((prev) => ({
              ...prev,
              stepDone: false,
            }));
            handleCompleteVerification();
          } else {
            setVerification((prev) => ({
              ...prev,
              step: nextStep,
              stepDone: false,
            }));
            detector.setStep(nextStep);
          }
        }, 700);
      },

      // onError callback
      (errMsg) => {
        setVerification((prev) => ({
          ...prev,
          aiLoading: false,
          aiError: errMsg,
        }));
      }
    );

    detectorRef.current = detector;
    detector.setStep(initialStep);

    try {
      await detector.init();
      setVerification((prev) => ({
        ...prev,
        aiLoading: false,
      }));
    } catch (err) {
      console.error("[RegisterPage] detector init failed:", err);
      setVerification((prev) => ({
        ...prev,
        aiLoading: false,
        aiError: "AI model failed to load. Please refresh and try again.",
      }));
    }
  };

  // Kept for compatibility — no longer called by UI buttons (AI drives this)
  const advanceVerification = () => {
    setVerification((prev) => ({
      ...prev,
      step: Math.min(prev.step + 1, TOTAL_AI_STEPS),
    }));
    if (detectorRef.current) {
      detectorRef.current.setStep(
        Math.min(verification.step + 1, TOTAL_AI_STEPS)
      );
    }
  };

  const handleCompleteVerification = async () => {
    closeVerification();
    const registered = await register();
    if (registered) {
      setTimeout(() => {
        voterIdRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 150);
    }
  };

  // completeVerification kept for fallback button
  const completeVerification = handleCompleteVerification;


  // Cleanup camera stream when modal closes
  useEffect(() => {
    if (!verification.open) {
      if (detectorRef.current) {
        detectorRef.current.destroy();
        detectorRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    }
  }, [verification.open]);


  // =====================================
  // MODAL HELPERS  (unchanged)
  // =====================================

  const openModal = ({
    type,
    title,
    message,
    detail = ""
  }) => {

    setModal({
      open: true,
      type,
      title,
      message,
      detail
    });

    if (type === "success") {

      setTimeout(() => {
        setModal((prev) => ({
          ...prev,
          open: false
        }));
      }, 3200);
    }
  };

  const closeModal = () => {
    setModal((prev) => ({
      ...prev,
      open: false
    }));
  };


  // =====================================
  // HANDLE CHANGE  (unchanged)
  // =====================================

  const handleChange = (e) => {

    const { name, value } = e.target;

    if (name === "full_name") {
      const alphabetsOnly = value.replace(/[^A-Za-z\s]/g, "");
      setFormData({ ...formData, full_name: alphabetsOnly });
      return;
    }

    if (name === "phone") {
      const numbersOnly = value.replace(/\D/g, "");
      if (numbersOnly.length <= 11) {
        setFormData({ ...formData, phone: numbersOnly });
      }
      return;
    }

    if (name === "cnic") {
      const numbersOnly = value.replace(/\D/g, "");
      let formattedCNIC = numbersOnly;
      if (numbersOnly.length > 5 && numbersOnly.length <= 12) {
        formattedCNIC = numbersOnly.slice(0, 5) + "-" + numbersOnly.slice(5);
      } else if (numbersOnly.length > 12) {
        formattedCNIC =
          numbersOnly.slice(0, 5) +
          "-" +
          numbersOnly.slice(5, 12) +
          "-" +
          numbersOnly.slice(12, 13);
      }
      if (numbersOnly.length <= 13) {
        setFormData({ ...formData, cnic: formattedCNIC });
      }
      return;
    }

    if (name === "constituency") {
      const alphabetsOnly = value.replace(/[^A-Za-z\s]/g, "");
      setFormData({ ...formData, constituency: alphabetsOnly });
      return;
    }

    setFormData({ ...formData, [name]: value });
  };


  // =====================================
  // REGISTER FUNCTION  (unchanged)
  // =====================================

  const register = async () => {

    try {

      setLoading(true);

      const response = await API.post("/register", formData);

      setSuccess(response.data.message);

      setVoterId(response.data.voter_id);

      setCopyState({ loading: false, error: "", success: false });

      openModal({
        type: "success",
        title: "Registration Complete",
        message: response.data.message,
        detail: response.data.voter_id
      });

      return true;

    } catch (error) {

      console.error(error);

      openModal({
        type: "error",
        title: "Registration Failed",
        message:
          error.response?.data?.message ||
          "Registration failed. Please try again."
      });

      return false;

    } finally {

      setLoading(false);
    }
  };


  const handleCopyVoterId = async () => {

    if (!voterId || copyState.loading) return;

    setCopyState({ loading: true, error: "", success: false });

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard access unavailable");
      }

      await navigator.clipboard.writeText(voterId);

      setCopyState({ loading: false, error: "", success: true });

      setTimeout(() => {
        navigate("/vote", { state: { voterId } });
      }, 500);

    } catch (error) {

      console.error(error);

      setCopyState({
        loading: false,
        error: "Copy failed. Please copy the voter ID manually.",
        success: false
      });
    }
  };


  // =====================================
  // UI  (interface unchanged — only step
  //      labels and button behaviour updated)
  // =====================================

  return (

    <>

      <div className="page">

        <div className="page-header">
          <div className="eyebrow">
            <ShieldCheck size={16} />
            Verified registration
          </div>

          <h1 className="section-title">
            Voter registration
          </h1>

          <p className="section-subtitle">
            Create your secure voting identity with official CNIC details.
          </p>
        </div>

        <div className="card form-card">

          <div className="form-grid">

            <div className="form-group">
              <label className="form-label">Full name</label>
              <div className="input-wrap">
                <UserPlus size={16} />
                <input
                  type="text"
                  name="full_name"
                  className="input"
                  placeholder="As printed on CNIC"
                  value={formData.full_name}
                  onChange={handleChange}
                />
              </div>
              <p className="helper-text">Use your official CNIC spelling.</p>
            </div>

            <div className="form-group">
              <label className="form-label">CNIC number</label>
              <div className="input-wrap">
                <IdCard size={16} />
                <input
                  type="text"
                  name="cnic"
                  className="input"
                  placeholder="00000-0000000-0"
                  value={formData.cnic}
                  onChange={handleChange}
                  maxLength={15}
                />
              </div>
              <p className="helper-text">Format will be applied automatically.</p>
            </div>

            <div className="form-group">
              <label className="form-label">Phone number</label>
              <div className="input-wrap">
                <Phone size={16} />
                <input
                  type="text"
                  name="phone"
                  className="input"
                  placeholder="03XXXXXXXXX"
                  value={formData.phone}
                  onChange={handleChange}
                  maxLength={11}
                />
              </div>
              <p className="helper-text">Used for secure voter notifications only.</p>
            </div>

            <div className="form-group">
              <label className="form-label">Constituency</label>
              <div className="input-wrap">
                <MapPin size={16} />
                <input
                  type="text"
                  name="constituency"
                  className="input"
                  placeholder="Lahore"
                  value={formData.constituency}
                  onChange={handleChange}
                />
              </div>
              <p className="helper-text">Enter the constituency shown on your CNIC.</p>
            </div>

          </div>

          <div className="form-actions">
            <button
              className={`button${loading ? " is-loading" : ""}`}
              onClick={openVerification}
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  Registering...
                </>
              ) : (
                "Create voter ID"
              )}
            </button>
            <span className="form-hint">
              A unique voter ID will be issued after verification.
            </span>
          </div>

          {success && (

            <div className="card success-card" ref={voterIdRef}>

              <h2>Registration complete</h2>

              <p>Save your voter ID for secure access to the ballot.</p>

              <div className="receipt-box">{voterId}</div>

              <div className="form-actions" style={{ marginTop: 16 }}>
                <button
                  className={`button${copyState.loading ? " is-loading" : ""}`}
                  onClick={handleCopyVoterId}
                >
                  {copyState.loading ? (
                    <>
                      <span className="spinner" />
                      Copying...
                    </>
                  ) : copyState.success ? (
                    "Copied! Redirecting..."
                  ) : (
                    "Copy voter ID"
                  )}
                </button>
                <span className="form-hint">
                  Copy the ID to proceed to the voting booth.
                </span>
              </div>

              {copyState.error && (
                <p className="helper-text" style={{ marginTop: 8 }}>
                  {copyState.error}
                </p>
              )}

            </div>

          )}

        </div>

      </div>


      {/* ── LIVENESS VERIFICATION MODAL ─────────────────────────
          Identical outer shell to original.
          Only the inner step content is AI-driven.
      ─────────────────────────────────────────────────────── */}

      {verification.open && (

        <div className="modal-overlay" onClick={closeVerification}>

          <div
            className="modal-card verification"
            onClick={(e) => e.stopPropagation()}
          >

            <button
              className="modal-close"
              onClick={closeVerification}
              aria-label="Close verification"
            >
              ×
            </button>

            <div className="modal-content">
              <div className="modal-title">
                Liveness verification
              </div>
              <div className="modal-message">
                Complete the AI-powered verification to receive your voter ID.
              </div>

              {/* ── Step checklist (same layout, updated labels) ── */}
              <div className="card" style={{ marginTop: 16 }}>
                <div style={{ display: "grid", gap: 12 }}>
                  {[
                    { n: 1, label: "Allow camera access" },
                    { n: 2, label: "Center your face" },
                    { n: 3, label: "Blink once" },
                    { n: 4, label: "Turn head left" },
                    { n: 5, label: "Turn head right" },
                    { n: 6, label: "Raise one hand" },
                  ].map(({ n, label }) => {
                    const done = verification.step > n - 1;
                    return (
                      <div
                        key={n}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          opacity: done ? 1 : 0.45,
                          transition: "opacity 0.3s",
                        }}
                      >
                        <span
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            background: done ? "var(--success)" : "var(--border)",
                            display: "grid",
                            placeItems: "center",
                            fontSize: 11,
                            color: done ? "#fff" : "var(--muted)",
                            flexShrink: 0,
                            transition: "background 0.3s",
                          }}
                        >
                          {done ? "✓" : n}
                        </span>
                        <strong>Step {n}:</strong> {label}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Camera + AI instruction area ── */}
              <div className="card" style={{ marginTop: 16 }}>
                <div style={{ display: "grid", gap: 12 }}>

                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    style={{
                      width: "100%",
                      borderRadius: 12,
                      background: "#0f172a",
                      aspectRatio: "16 / 9",
                      objectFit: "cover",
                    }}
                  />

                  {/* Camera error */}
                  {verification.cameraError && (
                    <div className="helper-text">
                      {verification.cameraError}
                    </div>
                  )}

                  {/* AI model error */}
                  {verification.aiError && (
                    <div className="helper-text" style={{ color: "var(--danger)" }}>
                      {verification.aiError}
                    </div>
                  )}

                  {/* STEP 0 — Start camera (unchanged) */}
                  {verification.step === 0 && (
                    <button
                      className={`button${verification.checking ? " is-loading" : ""}`}
                      onClick={requestCamera}
                    >
                      {verification.checking ? "Requesting..." : "Start camera check"}
                    </button>
                  )}

                  {/* STEPS 1–5 — AI is in control */}
                  {verification.step >= 1 && verification.step <= TOTAL_AI_STEPS && (
                    <>
                      {/* AI models loading spinner */}
                      {verification.aiLoading && (
                        <div
                          className="helper-text"
                          style={{ display: "flex", alignItems: "center", gap: 8 }}
                        >
                          <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                          Loading AI detection models…
                        </div>
                      )}

                      {/* Active instruction */}
                      {!verification.aiLoading && !verification.aiError && (
                        <div
                          className="helper-text"
                          style={{
                            fontWeight: 600,
                            color: verification.stepDone
                              ? "var(--success)"
                              : "var(--text)",
                            transition: "color 0.3s",
                          }}
                        >
                          {verification.stepDone
                            ? "✓ Detected! Moving to next step…"
                            : STEP_INSTRUCTIONS[verification.step]}
                        </div>
                      )}

                      {/* Fallback manual advance (only if AI errors) */}
                      {verification.aiError && (
                        <button className="button" onClick={advanceVerification}>
                          Continue manually
                        </button>
                      )}
                    </>
                  )}

                  {/* Legacy step 3 fallback kept for safety */}
                  {verification.step === 3 && verification.aiError && (
                    <>
                      <div className="helper-text">
                        Hold still while we finalize verification.
                      </div>
                      <button className="button" onClick={completeVerification}>
                        Continue to voter ID
                      </button>
                    </>
                  )}

                </div>
              </div>
            </div>

          </div>

        </div>
      )}


      {/* ── RESULT MODAL (completely unchanged) ──────────────── */}

      {modal.open && (

        <div className="modal-overlay" onClick={closeModal}>

          <div
            className={`modal-card ${modal.type}`}
            onClick={(e) => e.stopPropagation()}
          >

            <button
              className="modal-close"
              onClick={closeModal}
              aria-label="Close notification"
            >
              ×
            </button>

            <div className="modal-content">

              <div className="modal-title">
                {modal.title}
              </div>

              <div className="modal-message">
                {modal.message}
              </div>

              {modal.detail && (
                <div className="modal-detail">
                  {modal.detail}
                </div>
              )}

            </div>

          </div>

        </div>
      )}

    </>

  );
}

export default RegisterPage;
