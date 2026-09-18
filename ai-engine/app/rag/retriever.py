from app.core.config import settings
from app.rag.embeddings import embed_text
from app.rag.vector_store import get_connection


def retrieve_relevant_chunks(query: str, document_id: int | None = None) -> list[str]:
    """
    Recherche les chunks les plus pertinents pour une question donnée,
    via similarité cosinus native pgvector (opérateur <=>).

    Si document_id est fourni, la recherche est filtrée sur ce document
    uniquement (WHERE document_id = ...) -> plus rapide et plus pertinent
    que de chercher dans tous les documents mélangés.
    """
    query_embedding = [float(x) for x in embed_text(query)]

    conn = get_connection()
    try:
        with conn.cursor() as cur:
            if document_id is not None:
                cur.execute(
                    """
                    SELECT chunk_text
                    FROM document_chunk
                    WHERE document_id = %s
                    ORDER BY embedding <=> %s::vector
                    LIMIT %s
                    """,
                    (document_id, query_embedding, settings.TOP_K_RESULTS),
                )
            else:
                cur.execute(
                    """
                    SELECT chunk_text
                    FROM document_chunk
                    ORDER BY embedding <=> %s::vector
                    LIMIT %s
                    """,
                    (query_embedding, settings.TOP_K_RESULTS),
                )
            rows = cur.fetchall()
        return [row[0] for row in rows]
    finally:
        conn.close()