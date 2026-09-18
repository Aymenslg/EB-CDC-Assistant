import { WORKFLOW_API_BASE_URL } from "./config";
import type {
    DocumentCdc,
    CreateDocumentPayload,
    ValidationHistorique,
    StatutValidation,
} from "@/types/document";

export async function getDocuments(): Promise<DocumentCdc[]> {
    const res = await fetch(`${WORKFLOW_API_BASE_URL}/documents`);
    if (!res.ok) throw new Error("Erreur lors de la récupération des documents");
    return res.json();
}

export async function getDocumentById(id: number): Promise<DocumentCdc> {
    const res = await fetch(`${WORKFLOW_API_BASE_URL}/documents/${id}`);
    if (!res.ok) throw new Error("Document introuvable");
    return res.json();
}

export async function createDocument(
    payload: CreateDocumentPayload
): Promise<DocumentCdc> {
    const res = await fetch(`${WORKFLOW_API_BASE_URL}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Erreur lors de la création du document");
    return res.json();
}

export async function updateDocument(
    id: number,
    payload: Pick<DocumentCdc, "titre" | "contenu">
): Promise<DocumentCdc> {
    const res = await fetch(`${WORKFLOW_API_BASE_URL}/documents/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Erreur lors de la mise à jour du document");
    return res.json();
}

export async function deleteDocument(id: number): Promise<void> {
    const res = await fetch(`${WORKFLOW_API_BASE_URL}/documents/${id}`, {
        method: "DELETE",
    });
    if (!res.ok) throw new Error("Erreur lors de la suppression du document");
}

export async function changerStatut(
    id: number,
    nouveauStatut: StatutValidation,
    commentaire?: string
): Promise<DocumentCdc> {
    const res = await fetch(`${WORKFLOW_API_BASE_URL}/documents/${id}/statut`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nouveauStatut, commentaire }),
    });
    if (!res.ok) {
        const message = await res.text();
        throw new Error(message || "Transition de statut refusée");
    }
    return res.json();
}

export async function getHistorique(id: number): Promise<ValidationHistorique[]> {
    const res = await fetch(`${WORKFLOW_API_BASE_URL}/documents/${id}/historique`);
    if (!res.ok) throw new Error("Erreur lors de la récupération de l'historique");
    return res.json();
}

export async function downloadDocumentPdf(id: number): Promise<void> {
    const res = await fetch(`${WORKFLOW_API_BASE_URL}/documents/${id}/pdf`);
    if (!res.ok) throw new Error("Erreur lors de la génération du PDF");
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `CDC-${id}.pdf`;
    link.click();
    window.URL.revokeObjectURL(url);
}
export async function generateContenu(id: number): Promise<DocumentCdc> {
    const res = await fetch(`${WORKFLOW_API_BASE_URL}/documents/${id}/generate`, {
        method: "POST",
    });
    if (!res.ok) throw new Error("Erreur lors de la génération du CDC");
    return res.json();
}