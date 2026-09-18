package com.ebcdc.assistant.client;

import com.ebcdc.assistant.dto.AskResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Component
public class AiEngineClient {

    private final RestTemplate restTemplate;

    @Value("${ai.engine.base-url}")
    private String aiEngineBaseUrl;

    public AiEngineClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    /**
     * Appelle l'endpoint /generate de l'AI Engine avec un texte déjà complet
     * (ex: un besoin brut), SANS recherche RAG — évite que la génération
     * de CDC soit polluée par des chunks d'autres documents déjà indexés.
     */
    public String askQuestion(String question) {
        Map<String, String> requestBody = Map.of("question", question);
        Map<String, Object> response = restTemplate.postForObject(
                aiEngineBaseUrl + "/generate",
                requestBody,
                Map.class
        );
        if (response == null || !response.containsKey("answer")) {
            throw new RuntimeException("Réponse invalide de l'AI Engine");
        }
        return (String) response.get("answer");
    }

    /**
     * Appelle l'endpoint /ask de l'AI Engine — AVEC recherche RAG.
     * Utilisé par le chat. documentId optionnel : restreint la recherche
     * à un document précis si fourni.
     */
    public AskResponse ask(String question, Long documentId) {
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("question", question);
        requestBody.put("document_id", documentId);

        Map<String, Object> response = restTemplate.postForObject(
                aiEngineBaseUrl + "/ask",
                requestBody,
                Map.class
        );
        if (response == null || !response.containsKey("answer")) {
            throw new RuntimeException("Réponse invalide de l'AI Engine");
        }

        AskResponse result = new AskResponse();
        result.setQuestion((String) response.get("question"));
        result.setAnswer((String) response.get("answer"));
        result.setSourcesUsed((Integer) response.get("sources_used"));
        return result;
    }
    public String generateFromDocument(Long documentId) {
        Map<String, Object> response = restTemplate.postForObject(
                aiEngineBaseUrl + "/generate-from-document/" + documentId,
                null,
                Map.class
        );
        if (response == null || !response.containsKey("answer")) {
            throw new RuntimeException("Réponse invalide de l'AI Engine");
        }
        return (String) response.get("answer");
    }
}