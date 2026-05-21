/**
 * livenessDetector.js
 *
 * Real-time AI liveness detection using MediaPipe Face Mesh + Pose.
 * Loaded dynamically from CDN — no build-time deps needed.
 *
 * Detects:
 *  - Face presence (step 1: align face)
 *  - Blink          (step 2: blink once)
 *  - Head turn left  (step 3)
 *  - Head turn right (step 4)
 *  - Hand raised     (step 5)
 */

// ─────────────────────────────────────────────────────────────
// CDN loader — injects MediaPipe scripts once, returns Promise
// ─────────────────────────────────────────────────────────────

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.crossOrigin = "anonymous";
    s.onload = resolve;
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

async function loadMediaPipe() {
  const base = "https://cdn.jsdelivr.net/npm/@mediapipe";
  await loadScript(`${base}/camera_utils/camera_utils.js`);
  await loadScript(`${base}/control_utils/control_utils.js`);
  await loadScript(`${base}/drawing_utils/drawing_utils.js`);
  await loadScript(`${base}/face_mesh/face_mesh.js`);
  await loadScript(`${base}/pose/pose.js`);
}


// ─────────────────────────────────────────────────────────────
// Eye Aspect Ratio (EAR) — classic blink metric
// Uses MediaPipe Face Mesh landmark indices
//
// Right eye: 33, 160, 158, 133, 153, 144
// Left eye:  362, 385, 387, 263, 373, 380
// ─────────────────────────────────────────────────────────────

function dist(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function eyeAspectRatio(landmarks, indices) {
  const [p1, p2, p3, p4, p5, p6] = indices.map((i) => landmarks[i]);
  const vertical1 = dist(p2, p6);
  const vertical2 = dist(p3, p5);
  const horizontal = dist(p1, p4);
  return (vertical1 + vertical2) / (2.0 * horizontal);
}

const RIGHT_EYE = [33, 160, 158, 133, 153, 144];
const LEFT_EYE  = [362, 385, 387, 263, 373, 380];

// ─────────────────────────────────────────────────────────────
// Head yaw estimation from nose tip vs eye midpoint
// ─────────────────────────────────────────────────────────────

function estimateYaw(landmarks) {
  const noseTip   = landmarks[1];
  const leftEye   = landmarks[33];
  const rightEye  = landmarks[263];
  const eyeMidX   = (leftEye.x + rightEye.x) / 2;
  // positive → face turned right, negative → face turned left
  return (noseTip.x - eyeMidX) * 10; // scale to ~[-1, 1]
}


// ─────────────────────────────────────────────────────────────
// Main detector class
// ─────────────────────────────────────────────────────────────

export class LivenessDetector {

  constructor(videoElement, canvasElement, onStepComplete, onError) {
    this.video          = videoElement;
    this.canvas         = canvasElement;
    this.onStepComplete = onStepComplete; // (stepIndex) => void
    this.onError        = onError;        // (message) => void

    this.currentStep    = 0;   // which step we're actively watching
    this.running        = false;
    this.destroyed      = false;

    // ── Blink detection state ──
    this.earHistory     = [];    // last N EAR values
    this.blinkDetected  = false;
    this.blinkCooldown  = 0;     // frames to wait after a blink

    // ── Head turn state ──
    this.yawHistory     = [];
    this.headTurnFrames = 0;     // consecutive frames confirming turn

    // ── Hand raise state ──
    this.handRaiseFrames = 0;

    // ── Face alignment state ──
    this.faceAlignFrames = 0;

    // ── Models ──
    this.faceMesh = null;
    this.pose     = null;

    // ── Latest results (shared between model callbacks) ──
    this._latestFaceLandmarks = null;
    this._latestPoseLandmarks = null;

    // ── Animation frame handle ──
    this._rafHandle = null;
  }

  // ── Thresholds (tuned for reliability) ──────────────────────
  static THRESHOLDS = {
    EAR_BLINK:           0.21,   // EAR below this = eye closed
    EAR_OPEN:            0.26,   // EAR above this = eye open
    BLINK_FRAMES:        2,      // closed frames needed to count
    BLINK_COOLDOWN:      20,     // frames before next blink checked
    YAW_TURN:            0.18,   // yaw magnitude for head turn
    YAW_CONFIRM_FRAMES:  8,      // consecutive frames to confirm turn
    HAND_RAISE_FRAMES:   10,     // consecutive frames for hand raise
    FACE_ALIGN_FRAMES:   12,     // frames face must be centered
    FACE_CENTER_MARGIN:  0.25,   // fraction from edge for center check
    POSE_CONFIDENCE:     0.6,    // minimum landmark visibility
  };

  // ────────────────────────────────────────────────────────────
  // init — load models and start detection loop
  // ────────────────────────────────────────────────────────────

  async init() {
    try {
      await loadMediaPipe();
      await this._setupFaceMesh();
      await this._setupPose();
      this.running = true;
      this._processFrame();
    } catch (err) {
      console.error("[LivenessDetector] init error:", err);
      this.onError("AI model failed to load. Please refresh and try again.");
    }
  }

  async _setupFaceMesh() {
    const { FaceMesh } = window;
    this.faceMesh = new FaceMesh({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });
    this.faceMesh.setOptions({
      maxNumFaces:        1,
      refineLandmarks:    true,
      minDetectionConfidence: 0.6,
      minTrackingConfidence:  0.5,
    });
    this.faceMesh.onResults((results) => {
      if (this.destroyed) return;
      if (results.multiFaceLandmarks?.length > 0) {
        this._latestFaceLandmarks = results.multiFaceLandmarks[0];
      } else {
        this._latestFaceLandmarks = null;
      }
    });
    await this.faceMesh.initialize();
  }

  async _setupPose() {
    const { Pose } = window;
    this.pose = new Pose({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });
    this.pose.setOptions({
      modelComplexity:        1,
      smoothLandmarks:        true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence:  0.5,
    });
    this.pose.onResults((results) => {
      if (this.destroyed) return;
      this._latestPoseLandmarks = results.poseLandmarks ?? null;
    });
    await this.pose.initialize();
  }

  // ────────────────────────────────────────────────────────────
  // Frame loop — sends video frames to both models
  // ────────────────────────────────────────────────────────────

  _processFrame() {
    if (!this.running || this.destroyed) return;

    const run = async () => {
      if (!this.running || this.destroyed) return;

      if (
        this.video.readyState >= 2 &&
        !this.video.paused
      ) {
        // Send frame to face mesh
        await this.faceMesh.send({ image: this.video });

        // Only send to pose for steps that need it (hand raise)
        if (this.currentStep === 5) {
          await this.pose.send({ image: this.video });
        }

        // Evaluate current step
        this._evaluate();
      }

      this._rafHandle = requestAnimationFrame(run);
    };

    this._rafHandle = requestAnimationFrame(run);
  }

  // ────────────────────────────────────────────────────────────
  // Step router
  // ────────────────────────────────────────────────────────────

  _evaluate() {
    switch (this.currentStep) {
      case 1: this._checkFaceAlign();  break;
      case 2: this._checkBlink();      break;
      case 3: this._checkHeadLeft();   break;
      case 4: this._checkHeadRight();  break;
      case 5: this._checkHandRaise();  break;
      default: break;
    }
  }

  // ────────────────────────────────────────────────────────────
  // STEP 1 — Face alignment (face must be centered for N frames)
  // ────────────────────────────────────────────────────────────

  _checkFaceAlign() {
    const lm = this._latestFaceLandmarks;
    if (!lm) {
      this.faceAlignFrames = 0;
      return;
    }

    const noseTip = lm[1];
    const T = LivenessDetector.THRESHOLDS;

    const centered =
      noseTip.x > T.FACE_CENTER_MARGIN &&
      noseTip.x < (1 - T.FACE_CENTER_MARGIN) &&
      noseTip.y > T.FACE_CENTER_MARGIN &&
      noseTip.y < (1 - T.FACE_CENTER_MARGIN);

    if (centered) {
      this.faceAlignFrames++;
    } else {
      this.faceAlignFrames = Math.max(0, this.faceAlignFrames - 1);
    }

    if (this.faceAlignFrames >= T.FACE_ALIGN_FRAMES) {
      this.faceAlignFrames = 0;
      this._completeStep(1);
    }
  }

  // ────────────────────────────────────────────────────────────
  // STEP 2 — Blink detection
  // Tracks EAR over time; confirms close→open transition
  // ────────────────────────────────────────────────────────────

  _checkBlink() {
    const lm = this._latestFaceLandmarks;
    if (!lm) return;

    const T = LivenessDetector.THRESHOLDS;

    if (this.blinkCooldown > 0) {
      this.blinkCooldown--;
      return;
    }

    const rightEAR = eyeAspectRatio(lm, RIGHT_EYE);
    const leftEAR  = eyeAspectRatio(lm, LEFT_EYE);
    const avgEAR   = (rightEAR + leftEAR) / 2;

    this.earHistory.push(avgEAR);
    if (this.earHistory.length > 10) this.earHistory.shift();

    const closedFrames = this.earHistory.filter(
      (e) => e < T.EAR_BLINK
    ).length;

    // Blink = was closed for enough frames, and last frame is open again
    if (
      closedFrames >= T.BLINK_FRAMES &&
      avgEAR > T.EAR_OPEN
    ) {
      this.earHistory = [];
      this.blinkCooldown = T.BLINK_COOLDOWN;
      this._completeStep(2);
    }
  }

  // ────────────────────────────────────────────────────────────
  // STEP 3 — Head turn left
  // ────────────────────────────────────────────────────────────

  _checkHeadLeft() {
    const lm = this._latestFaceLandmarks;
    if (!lm) {
      this.headTurnFrames = 0;
      return;
    }

    const yaw = estimateYaw(lm);
    const T   = LivenessDetector.THRESHOLDS;

    if (yaw < -T.YAW_TURN) {
      this.headTurnFrames++;
    } else {
      this.headTurnFrames = Math.max(0, this.headTurnFrames - 2);
    }

    if (this.headTurnFrames >= T.YAW_CONFIRM_FRAMES) {
      this.headTurnFrames = 0;
      this._completeStep(3);
    }
  }

  // ────────────────────────────────────────────────────────────
  // STEP 4 — Head turn right
  // ────────────────────────────────────────────────────────────

  _checkHeadRight() {
    const lm = this._latestFaceLandmarks;
    if (!lm) {
      this.headTurnFrames = 0;
      return;
    }

    const yaw = estimateYaw(lm);
    const T   = LivenessDetector.THRESHOLDS;

    if (yaw > T.YAW_TURN) {
      this.headTurnFrames++;
    } else {
      this.headTurnFrames = Math.max(0, this.headTurnFrames - 2);
    }

    if (this.headTurnFrames >= T.YAW_CONFIRM_FRAMES) {
      this.headTurnFrames = 0;
      this._completeStep(4);
    }
  }

  // ────────────────────────────────────────────────────────────
  // STEP 5 — Hand raise (wrist above shoulder)
  // Uses MediaPipe Pose landmarks
  // ─────────────────────────────────────────────────────────────

  _checkHandRaise() {
    const lm = this._latestPoseLandmarks;
    if (!lm) {
      this.handRaiseFrames = 0;
      return;
    }

    const T = LivenessDetector.THRESHOLDS;

    // MediaPipe Pose indices:
    // 11 = left shoulder, 12 = right shoulder
    // 15 = left wrist,    16 = right wrist
    const leftShoulder  = lm[11];
    const rightShoulder = lm[12];
    const leftWrist     = lm[15];
    const rightWrist    = lm[16];

    // Check visibility confidence
    const leftVisible  = leftWrist.visibility  > T.POSE_CONFIDENCE &&
                         leftShoulder.visibility > T.POSE_CONFIDENCE;
    const rightVisible = rightWrist.visibility  > T.POSE_CONFIDENCE &&
                         rightShoulder.visibility > T.POSE_CONFIDENCE;

    // In image coords, smaller Y = higher on screen
    const leftRaised  = leftVisible  && leftWrist.y  < leftShoulder.y;
    const rightRaised = rightVisible && rightWrist.y < rightShoulder.y;

    if (leftRaised || rightRaised) {
      this.handRaiseFrames++;
    } else {
      this.handRaiseFrames = Math.max(0, this.handRaiseFrames - 2);
    }

    if (this.handRaiseFrames >= T.HAND_RAISE_FRAMES) {
      this.handRaiseFrames = 0;
      this._completeStep(5);
    }
  }

  // ────────────────────────────────────────────────────────────
  // Step completion — notify parent, advance step
  // ────────────────────────────────────────────────────────────

  _completeStep(step) {
    if (this.destroyed) return;
    this.onStepComplete(step);
    // Parent will call setStep() to advance
  }

  // ────────────────────────────────────────────────────────────
  // Public API
  // ────────────────────────────────────────────────────────────

  setStep(step) {
    this.currentStep     = step;
    this.headTurnFrames  = 0;
    this.handRaiseFrames = 0;
    this.faceAlignFrames = 0;
    this.earHistory      = [];
    this.blinkCooldown   = 0;
  }

  destroy() {
    this.destroyed = true;
    this.running   = false;
    if (this._rafHandle) {
      cancelAnimationFrame(this._rafHandle);
      this._rafHandle = null;
    }
    try { this.faceMesh?.close(); } catch (_) {}
    try { this.pose?.close();     } catch (_) {}
    this.faceMesh = null;
    this.pose     = null;
  }
}
