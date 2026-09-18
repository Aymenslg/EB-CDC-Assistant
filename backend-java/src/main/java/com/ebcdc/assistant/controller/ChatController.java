package com.ebcdc.assistant.controller;

import com.ebcdc.assistant.client.AiEngineClient;
import com.ebcdc.assistant.dto.AskRequest;
import com.ebcdc.assistant.dto.AskResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/chat")
public class ChatController {

    @Autowired
    private AiEngineClient aiEngineClient;

    @PostMapping
    public ResponseEntity<AskResponse> ask(@Valid @RequestBody AskRequest request) {
        AskResponse response = aiEngineClient.ask(request.getQuestion(), request.getDocumentId());
        return ResponseEntity.ok(response);
    }
}
