import requests
import json
from app.core.config import settings
def generate_response(prompt: str) -> str:
    """
    Envoie un prompt à Ollama et retourne la réponse générée par le LLM.
    """
    response = requests.post(
        f"{settings.OLLAMA_BASE_URL}/api/generate",
        json={
            "model": settings.OLLAMA_MODEL,
            "prompt": prompt,
            "stream": False,
            "keep_alive": "30m",
            "options": {
                "temperature": 0.2,
                "num_predict": 4200,
                "num_thread": 4,
                "num_ctx": 8192,
            },
        },
        timeout=1800,
    )
    response.raise_for_status()
    data = response.json()
    return data["response"]
def generate_response_stream(prompt: str):
    """
    Envoie un prompt à Ollama et streame la réponse token par token
    au fur et à mesure qu'elle est générée.
    """
    response = requests.post(
        f"{settings.OLLAMA_BASE_URL}/api/generate",
        json={
            "model": settings.OLLAMA_MODEL,
            "prompt": prompt,
            "stream": True,
            "keep_alive": "30m",
            "options": {
                "temperature": 0.2,
                "num_predict": 4200,
                "num_thread": 4,
                "num_ctx": 8192,
            },
        },
        timeout=1800,
        stream=True,
    )
    response.raise_for_status()
    for line in response.iter_lines():
        if line:
            chunk = json.loads(line)
            if "response" in chunk:
                yield chunk["response"]