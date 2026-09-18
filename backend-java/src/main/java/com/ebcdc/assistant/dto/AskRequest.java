package com.ebcdc.assistant.dto;

import jakarta.validation.constraints.NotBlank;

public class AskRequest {

    @NotBlank(message = "La question ne peut pas être vide")
    private String question;

    private Long documentId; // optionnel : restreint la recherche RAG à ce document

    public String getQuestion() {
        return question;
    }

    public void setQuestion(String question) {
        this.question = question;
    }

    public Long getDocumentId() {
        return documentId;
    }

    public void setDocumentId(Long documentId) {
        this.documentId = documentId;
    }
}