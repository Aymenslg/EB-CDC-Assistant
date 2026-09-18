from pydantic import BaseModel
from typing import Optional


class AskRequest(BaseModel):
    """
    Corps JSON attendu pour l'endpoint POST /ask.
    document_id est optionnel : s'il est fourni, la recherche RAG est
    limitée à ce document précis ; sinon elle porte sur tous les documents.
    """
    question: str
    document_id: Optional[int] = None


class AskResponse(BaseModel):
    """
    Réponse renvoyée par l'endpoint POST /ask.
    """
    question: str
    answer: str
    sources_used: int


class IngestResponse(BaseModel):
    """
    Réponse renvoyée par l'endpoint POST /ingest.
    """
    filename: str
    chunks_created: int
    status: str
    document_id: int

class GenerateRequest(BaseModel):
    question: str
    context: str | None = None

class GenerateResponse(BaseModel):
    answer: str