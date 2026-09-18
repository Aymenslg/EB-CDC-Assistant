import psycopg2
from psycopg2.extras import execute_values
from pgvector.psycopg2 import register_vector
from app.core.config import settings
from app.rag.embeddings import embed_chunks


def get_connection():
    """
    Ouvre une connexion PostgreSQL et enregistre le type 'vector'
    pour que psycopg2 sache convertir list[float] <-> vector pgvector.
    """
    conn = psycopg2.connect(
        host=settings.DB_HOST,
        port=settings.DB_PORT,
        dbname=settings.DB_NAME,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
    )
    register_vector(conn)
    return conn


def build_vector_store(document_id: int, chunks: list[str]) -> int:
    """
    Calcule les embeddings des chunks fournis et les insère en une seule
    requête batch dans document_chunk (rapide même sur CPU faible : un seul
    aller-retour réseau au lieu d'un par chunk).
    """
    embeddings = embed_chunks(chunks)

    conn = get_connection()
    try:
        with conn.cursor() as cur:
            rows = [
                (document_id, chunk_text, embedding)
                for chunk_text, embedding in zip(chunks, embeddings)
            ]
            execute_values(
                cur,
                "INSERT INTO document_chunk (document_id, chunk_text, embedding) VALUES %s",
                rows,
                template="(%s, %s, %s)",
            )
        conn.commit()
        return len(chunks)
    finally:
        conn.close()


def get_all_chunks_for_document(document_id: int) -> list[str]:
    """
    Récupère tous les chunks d'un document, dans l'ordre d'insertion
    (donc l'ordre du texte original) — pas de recherche par similarité,
    on veut tout le contenu indexé pour ce document.
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT chunk_text FROM document_chunk WHERE document_id = %s ORDER BY id ASC",
                (document_id,),
            )
            rows = cur.fetchall()
        return [row[0] for row in rows]
    finally:
        conn.close()