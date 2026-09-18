export type StatutValidation = "BROUILLON" | "EN_REVUE" | "APPROUVE" | "REJETE";

export interface DocumentCdc {
    id: number;
    titre: string;
    contenu: string;
    statut: StatutValidation;
    createdAt: string;
    updatedAt: string;
    sourceEb?: string;
    reference?: string;
}

export interface CreateDocumentPayload {
    titre: string;
    contenu: string;
}

export interface ValidationHistorique {
    id: number;
    documentId: number;
    ancienStatut: StatutValidation;
    nouveauStatut: StatutValidation;
    commentaire: string | null;
    dateChangement: string;
}