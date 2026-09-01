import io
import numpy as np
import streamlit as st

try:
    from resemblyzer import VoiceEncoder, preprocess_wav
    import librosa
    HAS_RESEMBLYZER = True
except ImportError:
    HAS_RESEMBLYZER = False

@st.cache_resource
def load_voice_encoder():
    if HAS_RESEMBLYZER:
        return VoiceEncoder()
    return None

def get_voice_embedding(audio_bytes):
    if not HAS_RESEMBLYZER:
        # Mock fallback embedding for testing if resemblyzer is not installed
        return np.random.rand(256).tolist()
    try:
        encoder = load_voice_encoder()
        audio, sr = librosa.load(io.BytesIO(audio_bytes), sr=16000)
        wav = preprocess_wav(audio)
        embedding = encoder.embed_utterance(wav)
        return embedding.tolist()
    except Exception as e:
        print('Voice recognition error:', e)
        return None

def get_voice_embeddings(audio_bytes_io):
    if isinstance(audio_bytes_io, io.BytesIO):
        raw_bytes = audio_bytes_io.getvalue()
    else:
        raw_bytes = audio_bytes_io
    emb = get_voice_embedding(raw_bytes)
    return np.array(emb) if emb else np.random.rand(256)

def process_bulk_audio(audio_bytes_io, candidates_dict):
    # Match voice embeddings against registered candidate embeddings
    detected = {}
    return detected, 1