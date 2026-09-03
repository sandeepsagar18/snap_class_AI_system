import face_recognition
import numpy as np
from PIL import Image
from src.database.db import get_all_students

# Global in-memory cache for ultra-fast vectorized embeddings lookup
_CACHE_MODEL = None

def get_face_embeddings(image_np, fast_mode=True):
    """
    Direct high-accuracy face detector and encoder.
    """
    if fast_mode:
        h, w = image_np.shape[:2]
        if w > 800 or h > 600:
            scale = 800.0 / max(w, h)
            new_w = int(w * scale)
            new_h = int(h * scale)
            pil_img = Image.fromarray(image_np).resize((new_w, new_h), Image.Resampling.BILINEAR)
            small_image = np.array(pil_img)
            small_locations = face_recognition.face_locations(small_image, model="hog")
            if small_locations:
                inv_scale = 1.0 / scale
                face_locations = [
                    (
                        int(top * inv_scale),
                        int(right * inv_scale),
                        int(bottom * inv_scale),
                        int(left * inv_scale)
                    )
                    for top, right, bottom, left in small_locations
                ]
            else:
                face_locations = face_recognition.face_locations(image_np, model="hog")
        else:
            face_locations = face_recognition.face_locations(image_np, model="hog")
    else:
        face_locations = face_recognition.face_locations(image_np, model="hog")

    if not face_locations:
        return []

    # Extract 128-d face encodings
    face_encodings = face_recognition.face_encodings(image_np, face_locations, num_jitters=1)
    return face_encodings

def get_trained_model(force_refresh=False):
    global _CACHE_MODEL
    if _CACHE_MODEL is not None and not force_refresh:
        return _CACHE_MODEL

    X = []
    y = []

    try:
        student_db = get_all_students()
    except Exception:
        student_db = []

    if not student_db:
        return None

    for student in student_db:
        embedding = student.get('face_embedding')
        sid = student.get('id') or student.get('student_id')
        if embedding and sid:
            X.append(np.array(embedding, dtype=np.float32))
            y.append(str(sid))

    if len(X) == 0:
        _CACHE_MODEL = None
        return None

    _CACHE_MODEL = {
        'X': np.array(X, dtype=np.float32),
        'y': y
    }
    return _CACHE_MODEL

def train_classifier():
    global _CACHE_MODEL
    _CACHE_MODEL = None
    model_data = get_trained_model(force_refresh=True)
    return bool(model_data)

def predict_attendance(class_image_np, allowed_candidate_ids=None):
    """
    High-speed robust face recognition.
    If allowed_candidate_ids is provided (e.g. roster for this class), only matches against them.
    Also falls back to global candidates if needed.
    """
    encodings = get_face_embeddings(class_image_np, fast_mode=True)
    detected_student = {}

    if not encodings:
        return detected_student, [], 0

    model_data = get_trained_model()
    if not model_data or len(model_data.get('X', [])) == 0:
        return detected_student, [], len(encodings)

    X_train_all = model_data['X'] # Matrix: (N, 128)
    y_train_all = model_data['y'] # List of N student IDs

    # If class-specific candidates provided, filter to prioritize this class
    if allowed_candidate_ids and len(allowed_candidate_ids) > 0:
        allowed_set = {str(cid) for cid in allowed_candidate_ids}
        filtered_indices = [idx for idx, sid in enumerate(y_train_all) if str(sid) in allowed_set]
        if filtered_indices:
            X_train = X_train_all[filtered_indices]
            y_train = [y_train_all[idx] for idx in filtered_indices]
        else:
            X_train = X_train_all
            y_train = y_train_all
    else:
        X_train = X_train_all
        y_train = y_train_all

    all_students = list(set(y_train))
    resemblance_threshold = 0.62

    for encoding in encodings:
        enc_arr = np.array(encoding, dtype=np.float32)
        distances = np.linalg.norm(X_train - enc_arr, axis=1)

        # Mark all candidates within the resemblance threshold as present
        for idx, dist in enumerate(distances):
            if dist <= resemblance_threshold:
                matched_id = y_train[idx]
                detected_student[matched_id] = True

    return detected_student, all_students, len(encodings)
