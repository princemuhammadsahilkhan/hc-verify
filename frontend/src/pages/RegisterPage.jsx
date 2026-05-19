import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, UserPlus, IdCard, Phone, MapPin } from "lucide-react";

import API from "../api";

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
    cameraError: ""
  });

  const [copyState, setCopyState] = useState({
    loading: false,
    error: "",
    success: false
  });

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const voterIdRef = useRef(null);


  // =====================================
  // VERIFICATION HELPERS
  // =====================================

  const openVerification = () => {
    setVerification({
      open: true,
      step: 0,
      checking: false,
      cameraReady: false,
      cameraError: ""
    });
  };

  const closeVerification = () => {
    setVerification((prev) => ({
      ...prev,
      open: false
    }));
  };

  const requestCamera = async () => {
    setVerification((prev) => ({
      ...prev,
      checking: true,
      cameraError: ""
    }));

    if (!navigator.mediaDevices?.getUserMedia) {
      setVerification((prev) => ({
        ...prev,
        checking: false,
        cameraError: "Camera access is not supported in this browser."
      }));
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setVerification((prev) => ({
        ...prev,
        checking: false,
        cameraReady: true,
        step: 1
      }));
    } catch (error) {
      console.error(error);
      setVerification((prev) => ({
        ...prev,
        checking: false,
        cameraError: "Camera permission was denied. You can still continue with demo verification."
      }));
    }
  };

  const advanceVerification = () => {
    setVerification((prev) => ({
      ...prev,
      step: Math.min(prev.step + 1, 3)
    }));
  };

  const completeVerification = async () => {
    closeVerification();
    const registered = await register();
    if (registered) {
      setTimeout(() => {
        voterIdRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
      }, 150);
    }
  };


  useEffect(() => {
    if (!verification.open && streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, [verification.open]);


  // =====================================
  // MODAL HELPERS
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
  // HANDLE CHANGE
  // =====================================

  const handleChange = (e) => {

    const { name, value } = e.target;

    // =====================================
    // FULL NAME → ONLY ALPHABETS
    // =====================================

    if (name === "full_name") {

      const alphabetsOnly = value.replace(/[^A-Za-z\s]/g, "");

      setFormData({
        ...formData,
        full_name: alphabetsOnly
      });

      return;
    }


    // =====================================
    // PHONE → ONLY NUMBERS + LIMIT 11
    // =====================================

    if (name === "phone") {

      const numbersOnly = value.replace(/\D/g, "");

      if (numbersOnly.length <= 11) {

        setFormData({
          ...formData,
          phone: numbersOnly
        });
      }

      return;
    }


    // =====================================
    // CNIC → ONLY NUMBERS + FORMAT
    // XXXXX-XXXXXXX-X
    // =====================================

    if (name === "cnic") {

      const numbersOnly = value.replace(/\D/g, "");

      let formattedCNIC = numbersOnly;

      if (
        numbersOnly.length > 5 &&
        numbersOnly.length <= 12
      ) {

        formattedCNIC =
          numbersOnly.slice(0, 5) +
          "-" +
          numbersOnly.slice(5);

      }

      else if (numbersOnly.length > 12) {

        formattedCNIC =
          numbersOnly.slice(0, 5) +
          "-" +
          numbersOnly.slice(5, 12) +
          "-" +
          numbersOnly.slice(12, 13);
      }

      if (numbersOnly.length <= 13) {

        setFormData({
          ...formData,
          cnic: formattedCNIC
        });
      }

      return;
    }


    // =====================================
    // CONSTITUENCY → ONLY ALPHABETS
    // =====================================

    if (name === "constituency") {

      const alphabetsOnly = value.replace(/[^A-Za-z\s]/g, "");

      setFormData({
        ...formData,
        constituency: alphabetsOnly
      });

      return;
    }


    // =====================================
    // NORMAL INPUTS
    // =====================================

    setFormData({
      ...formData,
      [name]: value
    });
  };


  // =====================================
  // REGISTER FUNCTION
  // =====================================

  const register = async () => {

    try {

      setLoading(true);

      const response = await API.post(
        "/register",
        formData
      );

      setSuccess(
        response.data.message
      );

      // SAVE VOTER ID

      setVoterId(
        response.data.voter_id
      );

      setCopyState({
        loading: false,
        error: "",
        success: false
      });

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
          error.response?.data?.message
          || "Registration failed. Please try again."
      });

      return false;

    } finally {

      setLoading(false);
    }
  };


  const handleCopyVoterId = async () => {

    if (!voterId || copyState.loading) {
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

      await navigator.clipboard.writeText(voterId);

      setCopyState({
        loading: false,
        error: "",
        success: true
      });

      setTimeout(() => {
        navigate("/vote", {
          state: {
            voterId
          }
        });
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
  // UI
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
              <label className="form-label">
                Full name
              </label>
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
              <p className="helper-text">
                Use your official CNIC spelling.
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">
                CNIC number
              </label>
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
              <p className="helper-text">
                Format will be applied automatically.
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">
                Phone number
              </label>
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
              <p className="helper-text">
                Used for secure voter notifications only.
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">
                Constituency
              </label>
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
              <p className="helper-text">
                Enter the constituency shown on your CNIC.
              </p>
            </div>

          </div>

          <div className="form-actions">
            <button
              className={`button${loading ? " is-loading" : ""}`}
              onClick={openVerification}
            >
              {
                loading ? (
                  <>
                    <span className="spinner" />
                    Registering...
                  </>
                ) : (
                  "Create voter ID"
                )
              }
            </button>
            <span className="form-hint">
              A unique voter ID will be issued after verification.
            </span>
          </div>

          {

            success && (

              <div className="card success-card" ref={voterIdRef}>

                <h2>
                  Registration complete
                </h2>

                <p>
                  Save your voter ID for secure access to the ballot.
                </p>

                <div className="receipt-box">
                  {voterId}
                </div>

                <div className="form-actions" style={{ marginTop: 16 }}>
                  <button
                    className={`button${copyState.loading ? " is-loading" : ""}`}
                    onClick={handleCopyVoterId}
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
                          : "Copy voter ID"
                    }
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

            )

          }

        </div>

      </div>

      {
        verification.open && (

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
                  Complete the simulated verification to receive your voter ID.
                </div>

                <div className="card" style={{ marginTop: 16 }}>
                  <div style={{ display: "grid", gap: 12 }}>
                    <div>
                      <strong>Step 1:</strong> Allow camera access
                    </div>
                    <div>
                      <strong>Step 2:</strong> Center your face
                    </div>
                    <div>
                      <strong>Step 3:</strong> Blink when prompted
                    </div>
                    <div>
                      <strong>Step 4:</strong> Hold still for confirmation
                    </div>
                  </div>
                </div>

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
                        objectFit: "cover"
                      }}
                    />

                    {verification.cameraError && (
                      <div className="helper-text">
                        {verification.cameraError}
                      </div>
                    )}

                    {verification.step === 0 && (
                      <button
                        className={`button${verification.checking ? " is-loading" : ""}`}
                        onClick={requestCamera}
                      >
                        {verification.checking ? "Requesting..." : "Start camera check"}
                      </button>
                    )}

                    {verification.step === 1 && (
                      <>
                        <div className="helper-text">
                          Align your face inside the frame and keep a neutral expression.
                        </div>
                        <button className="button" onClick={advanceVerification}>
                          Face aligned
                        </button>
                      </>
                    )}

                    {verification.step === 2 && (
                      <>
                        <div className="helper-text">
                          Blink once to confirm liveness.
                        </div>
                        <button className="button" onClick={advanceVerification}>
                          Blink detected
                        </button>
                      </>
                    )}

                    {verification.step === 3 && (
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
        )
      }

      {
        modal.open && (

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

                {
                  modal.detail && (
                    <div className="modal-detail">
                      {modal.detail}
                    </div>
                  )
                }

              </div>

            </div>

          </div>
        )
      }

    </>

  );
}

export default RegisterPage;