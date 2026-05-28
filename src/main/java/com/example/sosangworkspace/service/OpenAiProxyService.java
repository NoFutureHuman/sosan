package com.example.sosangworkspace.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class OpenAiProxyService {

    private final HttpClient httpClient = HttpClient.newBuilder().build();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final String openAiApiKey;

    public OpenAiProxyService(@Value("${openai.api-key:}") String openAiApiKey) {
        this.openAiApiKey = openAiApiKey;
    }

    public JsonNode analyzeByPrompt(String prompt) throws Exception {
        if (openAiApiKey == null || openAiApiKey.isBlank()) {
            throw new IllegalStateException("AI_NOT_CONNECTED");
        }

        var requestJson = objectMapper.createObjectNode();
        requestJson.put("model", "gpt-4o-mini");
        requestJson.put("temperature", 0.7);
        requestJson.set("response_format", objectMapper.createObjectNode().put("type", "json_object"));
        requestJson.set(
                "messages",
                objectMapper.createArrayNode().add(
                        objectMapper.createObjectNode()
                                .put("role", "user")
                                .put("content", prompt)
                )
        );

        String requestBody = objectMapper.writeValueAsString(requestJson);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.openai.com/v1/chat/completions"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + openAiApiKey)
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IllegalStateException("OpenAI API error: " + response.statusCode());
        }

        JsonNode root = objectMapper.readTree(response.body());
        String content = root.path("choices").path(0).path("message").path("content").asText("{}");
        return objectMapper.readTree(content);
    }
}
