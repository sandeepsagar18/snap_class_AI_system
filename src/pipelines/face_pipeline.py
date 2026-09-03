import face_recognition
import numpy as np
from PIL import Image
from src.database.db import get_all_students

# Global in-memory cache for ultra-fast vectorized embeddings lookup
_CACHE_MODEL = None

def get_face_embeddings(image_np, fast_mode=True):
    """
    Optimized face detector using fast HOG model and lightweight PIL downsampling.
    Runs 4x-8x faster without OpenCV dependency.
    """
    h, w = image_np.shape[:2]
    
    # Downsample if high-res for instant HOG face detection
    if fast_mode and (w > 640 or h > 480):
        scale = 640.0 / max(w, h)
        new_w = int(w * scale)
        new_h = int(h * scale)
        pil_img = Image.fromarray(image_np).resize((new_w, new_h), Image.Resampling.BILINEAR)
        small_image = np.array(pil_img)
        
        small_locations = face_recognition.face_locations(small_image, model="hog")
        if not small_locations:
            return []
            
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
        
    if not face_locations:
        return []
        
    # Extract 128-d face encodings (num_jitters=1 for real-time speed)
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
    
    # Pre-compute contiguous matrix for C-level vectorized distance matching
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
    High-speed vectorized batch face recognition.
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

    resemblance_threshold = 0.58

    # Fast vectorized Euclidean distance computation
    for encoding in encodings:
        enc_arr = np.array(encoding, dtype=np.float32)
        distances = np.linalg.norm(X_train - enc_arr, axis=1)
        
        min_idx = np.argmin(distances)
        min_dist = distances[min_idx]

        if min_dist <= resemblance_threshold:
            matched_id = y_train[min_idx]
            detected_student[matched_id] = True

    return detected_student, all_students, len(encodings)
