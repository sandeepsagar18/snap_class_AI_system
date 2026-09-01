import os
import toml
from supabase import create_client, Client
import streamlit as st

def get_supabase_client() -> Client:
    # 1. Environment variables
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")
    if url and key:
        return create_client(url, key)

    # 2. Streamlit secrets if available
    try:
        url = st.secrets.get("SUPABASE_URL")
        key = st.secrets.get("SUPABASE_KEY")
        if url and key:
            return create_client(url, key)
    except Exception:
        pass

    # 3. Local secrets file if present
    try:
        secrets_path = os.path.join(os.path.dirname(__file__), "..", "..", ".streamlit", "secrets.toml")
        if os.path.exists(secrets_path):
            secrets = toml.load(secrets_path)
            return create_client(secrets.get("SUPABASE_URL", ""), secrets.get("SUPABASE_KEY", ""))
    except Exception:
        pass

    # Fallback to public client
    return create_client(
        os.environ.get("SUPABASE_URL", "https://hkhuvtwtctlfmckuarmb.supabase.co"),
        os.environ.get("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_anon_key")
    )

supabase: Client = get_supabase_client()