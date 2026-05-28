package com.example.sosangworkspace.controller;

import com.example.sosangworkspace.service.AnalysisOrchestratorService;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analysis")
@CrossOrigin(origins = "*")
public class AnalysisController {

    private final AnalysisOrchestratorService orchestratorService;

    public AnalysisController(AnalysisOrchestratorService orchestratorService) {
        this.orchestratorService = orchestratorService;
    }

    @PostMapping("/next")
    public ResponseEntity<?> next(@RequestBody Map<String, Object> request) {
        try {
            Map<String, Object> response = orchestratorService.runNextStep(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new LinkedHashMap<>();
            error.put(
                    "error",
                    (e.getMessage() != null && e.getMessage().contains("AI_NOT_CONNECTED"))
                            ? "AI_NOT_CONNECTED"
                            : "ANALYSIS_PIPELINE_FAILED"
            );
            error.put("message", e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }
}
