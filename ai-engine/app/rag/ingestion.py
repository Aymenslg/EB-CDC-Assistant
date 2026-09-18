

from pathlib import Path
import fitz  # PyMuPDF
from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.core.config import settings


def extract_text_from_pdf(pdf_path: Path) -> str:
    """
    Extrait tout le texte brut d'un fichier PDF.
    """
    doc = fitz.open(pdf_path)
    full_text = ""
    for page in doc:
        full_text += page.get_text()
    doc.close()
    return full_text


def split_text_into_chunks(text: str) -> list[str]:
    """
    Découpe un texte brut en une liste de chunks,
    en utilisant les paramètres définis dans config.py.
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.CHUNK_SIZE,
        chunk_overlap=settings.CHUNK_OVERLAP,
    )
    return splitter.split_text(text)


def ingest_pdf(pdf_path: Path) -> list[str]:
    """
    Fonction principale d'ingestion : prend un chemin de PDF
    et retourne directement la liste des chunks prêts à être
    transformés en embeddings.
    """
    raw_text = extract_text_from_pdf(pdf_path)
    chunks = split_text_into_chunks(raw_text)
    return chunks