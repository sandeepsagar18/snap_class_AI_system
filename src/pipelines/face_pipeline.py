import face_recognition
import numpy as np
from src.database.db import get_all_students
import streamlit as st

def get_face_embeddings(image_np):
    face_locations = face_recognition.face_locations(image_np)
    face_encodings = face_recognition.face_encodings(image_np, face_locations)
    return face_encodings

@st.cache_resource
def get_trained_model():
    X = []
    y = []

    student_db = get_all_students()
    if not student_db:
        return None
    
    for student in student_db:
        embedding = student.get('face_embedding')
        sid = student.get('id') or student.get('student_id')
        if embedding and sid:
            X.append(np.array(embedding))
            y.append(str(sid))

    if len(X) == 0:
        return None
    
    return {'X': X, 'y': y}

def train_classifier():
    try:
        st.cache_resource.clear()
    except Exception:
        pass
    model_data = get_trained_model()
    return bool(model_data)

def predict_attendance(class_image_np):
    encodings = get_face_embeddings(class_image_np)
    detected_student = {}

    model_data = get_trained_model()
    if not model_data or not model_data.get('X'):
        return detected_student, [], len(encodings)
    
    X_train = model_data['X']
    y_train = model_data['y']
    all_students = list(set(y_train))

    resemblance_threshold = 0.60

    for encoding in encodings:
        best_match_id = None
        min_distance = 999.0

        for idx, student_embedding in enumerate(X_train):
            dist = np.linalg.norm(student_embedding - encoding)
            if dist < min_distance:
                min_distance = dist
                best_match_id = y_train[idx]

        if best_match_id and min_distance <= resemblance_threshold:
            detected_student[best_match_id] = True

    return detected_student, all_students, len(encodings)
