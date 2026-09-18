

from sentence_transformers import SentenceTransformer
from app.core.config import settings


_embedding_model = SentenceTransformer(settings.EMBEDDING_MODEL)


def embed_text(text: str) -> list[float]:
    """
    Transforme un seul texte en vecteur d'embedding.
    """
    embedding = _embedding_model.encode(text)
    return embedding.tolist()


def embed_chunks(chunks: list[str]) -> list[list[float]]:
    """
    Transforme une liste de chunks en une liste de vecteurs d'embedding.
    Traite tous les chunks en un seul batch (plus rapide qu'un par un).
    """
    embeddings = _embedding_model.encode(chunks)
    return embeddings.tolist()