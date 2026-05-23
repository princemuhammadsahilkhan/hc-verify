"""
face_service.py

Face embedding extraction and matching using MediaPipe Face Mesh + OpenCV.

Extracts a 128-point normalized landmark vector as a face "embedding".
Compares embeddings using cosine similarity.

No heavy ML model download needed — uses MediaPipe which is already installed.
"""

import cv2
import numpy as np
import base64
import json
from io import BytesIO
from PIL import Image
import mediapipe as mp

# ── MediaPipe setup ───────────────────────────────────────────
_mp_face_mesh = mp.solutions.face_mesh
_face_mesh = _mp_face_mesh.FaceMesh(
    static_image_mode=True,
    max_num_faces=1,
    refine_landmarks=True,
    min_detection_confidence=0.5,
)

# Similarity threshold — tune if needed
MATCH_THRESHOLD = 0.999


def _decode_image(image_b64: str) -> np.ndarray:
    """Decode a base64 image string to an OpenCV BGR array."""
    # Strip data URL prefix if present
    if "," in image_b64:
        image_b64 = image_b64.split(",", 1)[1]

    img_bytes = base64.b64decode(image_b64)
    img_array = np.frombuffer(img_bytes, dtype=np.uint8)
    img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
    return img


def _extract_embedding(image_b64: str) -> list | None:
    """
    Extract a normalized face landmark embedding from a base64 image.
    Returns a flat list of floats, or None if no face detected.
    """
    img = _decode_image(image_b64)
    if img is None:
        return None

    # Convert BGR → RGB for MediaPipe
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    results = _face_mesh.process(img_rgb)

    if not results.multi_face_landmarks:
        return None

    landmarks = results.multi_face_landmarks[0].landmark

    # Use 128 key landmarks (covers full face geometry)
    KEY_POINTS = [
        # Jawline
        10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
        397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
        172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109,
        # Eyes
        33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158,
        159, 160, 161, 246, 362, 382, 381, 380, 374, 373, 390, 249,
        263, 466, 388, 387, 386, 385, 384, 398,
        # Nose
        1, 2, 5, 4, 19, 94, 2, 164, 0, 11, 12, 13, 14, 15, 16, 17,
        # Mouth
        61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375, 321,
        405, 314, 17, 84, 181, 91, 146, 76, 77, 90, 180, 85, 16,
        # Cheeks and forehead
        116, 123, 147, 213, 192, 214, 210, 211, 32, 208, 199, 428,
        262, 431, 432, 434, 430, 394
    ]

    # Deduplicate while preserving order
    seen = set()
    unique_points = []
    for p in KEY_POINTS:
        if p not in seen and p < len(landmarks):
            seen.add(p)
            unique_points.append(p)

    coords = []
    for idx in unique_points:
        lm = landmarks[idx]
        coords.extend([lm.x, lm.y, lm.z])

    embedding = np.array(coords, dtype=np.float32)

    # Normalize to unit vector (cosine similarity friendly)
    norm = np.linalg.norm(embedding)
    if norm == 0:
        return None

    embedding = embedding / norm
    return embedding.tolist()


def _cosine_similarity(a: list, b: list) -> float:
    """Cosine similarity between two embedding vectors."""
    va = np.array(a, dtype=np.float32)
    vb = np.array(b, dtype=np.float32)
    dot = np.dot(va, vb)
    norm = np.linalg.norm(va) * np.linalg.norm(vb)
    if norm == 0:
        return 0.0
    return float(dot / norm)


# ── Public API ────────────────────────────────────────────────

def extract_embedding(image_b64: str) -> dict:
    """
    Extract face embedding from base64 image.
    Returns { success, embedding, message }
    """
    try:
        embedding = _extract_embedding(image_b64)
        if embedding is None:
            return {
                "success": False,
                "embedding": None,
                "message": "No face detected in image"
            }
        return {
            "success": True,
            "embedding": embedding,
            "message": "Face embedding extracted"
        }
    except Exception as e:
        print(f"[FaceService] extract_embedding error: {e}")
        return {
            "success": False,
            "embedding": None,
            "message": "Failed to process image"
        }


def match_faces(stored_embedding_json: str, live_image_b64: str) -> dict:
    """
    Compare stored embedding (JSON string) against a live image.
    Returns { match, similarity, message }
    """
    try:
        stored = json.loads(stored_embedding_json)
        live_result = _extract_embedding(live_image_b64)

        if live_result is None:
            return {
                "match": False,
                "similarity": 0.0,
                "message": "No face detected in live image"
            }

        similarity = _cosine_similarity(stored, live_result)
        matched = similarity >= MATCH_THRESHOLD

        return {
            "match": matched,
            "similarity": round(similarity, 4),
            "message": "Face matched" if matched else "Face did not match"
        }

    except Exception as e:
        print(f"[FaceService] match_faces error: {e}")
        return {
            "match": False,
            "similarity": 0.0,
            "message": "Face comparison failed"
        }
