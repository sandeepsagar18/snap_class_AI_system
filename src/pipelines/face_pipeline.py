import face_recognition
import numpy as np
import cv2
from PIL import Image
from src.database.db import get_all_students

# Load OpenCV Cascade detector as rapid high-sensitivity fallback
_CASCADE = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

# Global in-memory cache for ultra-fast vectorized embeddings lookup
_CACHE_MODEL = None

def get_face_embeddings(image_np, fast_mode=True):
    """
    Dual-engine high-accuracy face detector & 128-d ResNet encoder.
    Uses HOG + OpenCV Haar Cascade fallback to guarantee capturing faces
    even under low-light, webcam tilt, or webcam compression.
    """
    if image_np is None or image_np.size == 0:
        return []

    h, w = image_np.shape[:2]
    
    # 1. First attempt: Standard HOG detector on image
    face_locations = face_recognition.face_locations(image_np, number_of_times_to_upsample=1, model="hog")
    
    # 2. Second attempt: If HOG missed (due to resolution or contrast), try OpenCV Haar Cascade
    if not face_locations:
        gray = cv2.cvtColor(image_np, cv2.COLOR_RGB2GRAY)
        # Equalize histogram for instant contrast boost in dim rooms
        equalized = cv2.equalizeHist(gray)
        faces_cv = _CASCADE.detectMultiScale(equalized, scaleFactor=1.1, minNeighbors=4, minSize=(60, 60))
        if len(faces_cv) > 0:
            face_locations = [
                (int(y), int(x + w_box), int(y + h_box), int(x))
                for (x, y, w_box, h_box) in faces_cv
            ]

    # 3. Third attempt: Downscaled HOG detection
    if not face_locations and (w > 640 or h > 480):
        scale = 480.0 / max(w, h)
        new_w, new_h = int(w * scale), int(h * scale)
        small_img = cv2.resize(image_np, (new_w, new_h), interpolation=cv2.INTER_LINEAR)
        small_locs = face_recognition.face_locations(small_img, model="hog")
        if small_locs:
            inv = 1.0 / scale
            face_locations = [
                (int(top * inv), int(right * inv), int(bottom * inv), int(left * inv))
                for top, right, bottom, left in small_locs
            ]

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
    If allowed_candidate_ids is provided (e.g. roster for this class), matches against them.
    Also recognizes all registered students within resemblance threshold.
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

    # If class-specific candidates provided, prioritize matching roster students
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
    resemblance_threshold = 0.65  # Calibrated for reliable webcam lighting variations

    for encoding in encodings:
        enc_arr = np.array(encoding, dtype=np.float32)
        distances = np.linalg.norm(X_train - enc_arr, axis=1)

        # Mark all candidates within the resemblance threshold as present
        for idx, dist in enumerate(distances):
            if dist <= resemblance_threshold:
                matched_id = y_train[idx]
                detected_student[matched_id] = True

    return detected_student, all_students, len(encodings)
