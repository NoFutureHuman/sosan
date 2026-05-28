package com.example.sosangworkspace.controller;

import com.example.sosangworkspace.service.OpenAiProxyService;
import com.fasterxml.jackson.databind.JsonNode;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/llm")
@CrossOrigin(origins = "*")
public class OpenAiController {

    private final OpenAiProxyService openAiProxyService;

    public OpenAiController(OpenAiProxyService openAiProxyService) {
        this.openAiProxyService = openAiProxyService;
    }

    @PostMapping("/analyze")
    public ResponseEntity<?> analyze(@RequestBody Map<String, Object> body) {
        try {
            String prompt = String.valueOf(body.getOrDefault("prompt", ""));
            if (prompt.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "prompt is required"));
            }
            JsonNode result = openAiProxyService.analyzeByPrompt(prompt);
            return ResponseEntity.ok(result);
        } catch (IllegalStateException e) {
            if ("AI_NOT_CONNECTED".equals(e.getMessage())) {
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                        .body(Map.of("error", "AI_NOT_CONNECTED"));
            }
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "AI_PROXY_ERROR"));
        }
    }
}
