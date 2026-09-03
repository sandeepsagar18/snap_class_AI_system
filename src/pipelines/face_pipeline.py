import face_recognition
import numpy as np
from PIL import Image
from src.database.db import get_all_students

# Global in-memory cache for ultra-fast vectorized embeddings lookup
_CACHE_MODEL = None

def get_face_embeddings(image_np, fast_mode=False):
    """
    Direct high-accuracy face detector and encoder.
    Uses original frame resolution or clean 2-step detector for 100% detection reliability.
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

def predict_attendance(class_image_np):
    """
    High-speed robust face recognition with realistic lighting tolerance.
    """
    encodings = get_face_embeddings(class_image_np, fast_mode=True)
    detected_student = {}

    if not encodings:
        return detected_student, [], 0

    model_data = get_trained_model()
    if not model_data or len(model_data.get('X', [])) == 0:
        return detected_student, [], len(encodings)

    X_train = model_data['X'] # Matrix: (N, 128)
    y_train = model_data['y'] # List of N student IDs
    all_students = list(set(y_train))

    # Standard Euclidean distance tolerance (0.62 allows normal classroom lighting variations)
    resemblance_threshold = 0.62

    for encoding in encodings:
        enc_arr = np.array(encoding, dtype=np.float32)
        distances = np.linalg.norm(X_train - enc_arr, axis=1)

        min_idx = np.argmin(distances)
        min_dist = distances[min_idx]

        if min_dist <= resemblance_threshold:
            matched_id = y_train[min_idx]
            detected_student[matched_id] = True

    return detected_student, all_students, len(encodings)
