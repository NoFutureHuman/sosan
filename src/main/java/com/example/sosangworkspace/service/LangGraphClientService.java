package com.example.sosangworkspace.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class LangGraphClientService {

    private final HttpClient httpClient = HttpClient.newBuilder().build();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${app.langgraph.base-url:http://localhost:8001}")
    private String langGraphBaseUrl;

    public JsonNode runAnalysis(Map<String, Object> payload) throws Exception {
        String requestBody = objectMapper.writeValueAsString(payload);
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(langGraphBaseUrl + "/run"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            String body = response.body() == null ? "" : response.body();
            if (body.contains("AI_NOT_CONNECTED")) {
                throw new IllegalStateException("AI_NOT_CONNECTED");
            }
            throw new IllegalStateException("LANGGRAPH_ERROR_" + response.statusCode());
        }
        return objectMapper.readTree(response.body());
    }
}
