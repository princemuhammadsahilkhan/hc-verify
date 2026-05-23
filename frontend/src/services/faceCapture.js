/**
 * faceCapture.js
 * Captures a single frame from a video element and returns base64 JPEG.
 */

export function captureFrameFromVideo(videoElement, quality = 0.85) {
  if (!videoElement) return null;

  const canvas = document.createElement("canvas");
  canvas.width  = videoElement.videoWidth  || 640;
  canvas.height = videoElement.videoHeight || 480;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

  // Returns full data URL: "data:image/jpeg;base64,..."
  return canvas.toDataURL("image/jpeg", quality);
}
