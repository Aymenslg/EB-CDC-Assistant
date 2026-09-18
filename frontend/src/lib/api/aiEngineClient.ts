import { AI_ENGINE_BASE_URL } from "./config";
import type { AskRequest, AskResponse, IngestResponse } from "@/types/rag";

export async function ingestDocument(file: File): Promise<IngestResponse> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${AI_ENGINE_BASE_URL}/ingest`, {
        method: "POST",
        body: formData,
    });
    if (!res.ok) {
        throw new Error("Erreur lors de l'ingestion du document");
    }
    return res.json();
}
export async function generateFromDocument(
    documentId: number
): Promise<{ answer: string }> {
    const res = await fetch(
        `${AI_ENGINE_BASE_URL}/generate-from-document/${documentId}`,
        {
            method: "POST",
        }
    );
    if (!res.ok) {
        throw new Error("Erreur lors de la génération du cahier des charges");
    }
    return res.json();
}


export async function askQuestion(request: AskRequest): Promise<AskResponse> {
    const res = await fetch(`${AI_ENGINE_BASE_URL}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
    });
    if (!res.ok) {
        throw new Error("Erreur lors de la requête au moteur IA");
    }
    return res.json();
}

export async function askQuestionStream(
    request: AskRequest,
    onChunk: (text: string) => void
): Promise<void> {
    const res = await fetch(`${AI_ENGINE_BASE_URL}/ask/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
    });
    if (!res.ok || !res.body) {
        throw new Error("Erreur lors de la requête au moteur IA");
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        onChunk(text);
    }
}