package com.example.sosangworkspace.controller;

import com.example.sosangworkspace.service.AnalysisService;
import com.example.sosangworkspace.service.JwtService;
import com.example.sosangworkspace.service.NewStartupAnalysisService;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analysis")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class AnalysisController {

    private final AnalysisService analysisService;
    private final NewStartupAnalysisService newStartupAnalysisService;
    private final JwtService jwtService;

    @PostMapping("/run")
    public ResponseEntity<String> runAnalysisWorkflow(
            @RequestBody Map<String, Object> payload,
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) throws Exception {
        Long userId = jwtService.parseUserId(authorization);
        String resultJson = analysisService.runWorkflow(payload, userId);
        return ResponseEntity.ok()
                .header("Content-Type", "application/json; charset=UTF-8")
                .body(resultJson);
    }

    /** 신생 창업자: 답변 충분성 판단 + 추가 질문 생성 */
    @PostMapping("/evaluate")
    public ResponseEntity<Map<String, Object>> evaluate(@RequestBody Map<String, Object> raw) {
        return ResponseEntity.ok(newStartupAnalysisService.evaluate(AnalysisRequestMaps.toStringMap(raw)));
    }

    /** 신생 창업자: 최종 창업 분석 보고서 (AiAnalysisResult JSON 문자열) */
    @PostMapping("/new")
    public ResponseEntity<Map<String, Object>> analyzeNew(
            @RequestBody Map<String, Object> raw,
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        Long userId = jwtService.parseUserId(authorization);
        Map<String, Object> result = newStartupAnalysisService.analyzeNew(
                AnalysisRequestMaps.toStringMap(raw),
                userId
        );
        if (result.containsKey("error") && !result.containsKey("report")) {
            return ResponseEntity.internalServerError().body(result);
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "ok",
                "existingOwnerEngine", "java-langgraph4j",
                "newStartupEngine", "java-langgraph4j",
                "hint", "기존·신생 분석 모두 Spring(8081) 내부에서 처리됩니다."
        ));
    }
}
