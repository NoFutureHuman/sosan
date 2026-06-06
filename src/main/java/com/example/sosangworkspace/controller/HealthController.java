package com.example.sosangworkspace.controller;

import com.example.sosangworkspace.repository.AnalysisHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/health")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class HealthController {

    private final AnalysisHistoryRepository historyRepository;

    @GetMapping
    public Map<String, Object> health() {
        long count = historyRepository.count();
        return Map.of(
                "status", "ok",
                "database", "connected",
                "analysisHistoryCount", count
        );
    }
}
