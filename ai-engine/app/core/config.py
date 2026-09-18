from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    """
    Configuration centrale de l'AI Engine.
    Toutes les valeurs peuvent être surchargées via un fichier .env
    à la racine du dossier ai-engine/.
    """
    # --- Métadonnées de l'app ---
    APP_NAME: str = "EB-CDC Assistant - AI Engine"
    APP_VERSION: str = "0.1.0"

    # --- Ollama (LLM local) ---
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.2:3b"

    # --- Embeddings ---
    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    EMBEDDING_DIMENSION: int = 384

    # --- PostgreSQL (pgvector) ---
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_NAME: str = "ebcdc_db"
    DB_USER: str = "ebcdc_user"
    DB_PASSWORD: str = "ebcdc_user"

    # --- Chemins des données (RAG) ---
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent  # -> ai-engine/
    RAW_PDFS_DIR: Path = BASE_DIR / "data" / "raw_pdfs"
    VECTOR_DB_DIR: Path = BASE_DIR / "data" / "vector_db"

    # --- Paramètres RAG ---
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200
    TOP_K_RESULTS: int = 3

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


# Instance unique réutilisée dans tout le projet (pattern singleton)
settings = Settings()