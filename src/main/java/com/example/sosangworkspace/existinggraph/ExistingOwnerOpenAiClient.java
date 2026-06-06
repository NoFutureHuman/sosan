package com.example.sosangworkspace.existinggraph;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Component
class ExistingOwnerOpenAiClient {

    private static final String MODEL = "gpt-4o-mini";
    private static final double TEMPERATURE = 0.3;

    @Value("${openai.api.key:}")
    private String openaiApiKey;

    private final RestClient restClient = RestClient.builder()
            .baseUrl("https://api.openai.com")
            .build();

    void ensureConnected() {
        if (openaiApiKey == null || openaiApiKey.isBlank()) {
            throw new RuntimeException("AI_NOT_CONNECTED");
        }
    }

    @SuppressWarnings("unchecked")
    Map<String, Object> invokeJson(String prompt, String errorPrefix, int maxTokens) {
        ensureConnected();

        Map<String, Object> requestBody = Map.of(
                "model", MODEL,
                "messages", List.of(Map.of("role", "user", "content", prompt)),
                "temperature", TEMPERATURE,
                "max_tokens", maxTokens
        );

        try {
            Map<String, Object> response = restClient.post()
                    .uri("/v1/chat/completions")
                    .header("Authorization", "Bearer " + openaiApiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .body(Map.class);

            List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
            Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
            String raw = String.valueOf(message.get("content"));

            Map<String, Object> parsed = ExistingOwnerJsonUtils.parseJsonObject(raw);
            return parsed;
        } catch (RuntimeException e) {
            if ("AI_NOT_CONNECTED".equals(e.getMessage())) {
                throw e;
            }
            if ("NOT_OBJECT".equals(e.getMessage())) {
                throw new RuntimeException(errorPrefix + "_NOT_OBJECT", e);
            }
            throw new RuntimeException(errorPrefix + "_JSON_PARSE_ERROR: " + e.getMessage(), e);
        } catch (Exception e) {
            throw new RuntimeException(errorPrefix + "_JSON_PARSE_ERROR: " + e.getMessage(), e);
        }
    }
}
