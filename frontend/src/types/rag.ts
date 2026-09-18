export interface AskRequest {
    question: string;
    document_id?: number;
}

export interface AskResponse {
    question: string;
    answer: string;
    sources_used: number;
}

export interface IngestResponse {
    filename: string;
    chunks_created: number;
    status: string;
    document_id: number;
}