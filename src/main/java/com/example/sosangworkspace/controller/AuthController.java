package com.example.sosangworkspace.controller;

import com.example.sosangworkspace.service.AuthService;
import com.example.sosangworkspace.service.JwtService;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final JwtService jwtService;

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "ok",
                "auth", "enabled",
                "features", "register,login,history-detail"
        ));
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody Map<String, String> body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(
                body.get("email"),
                body.get("password"),
                body.get("name"),
                body.get("businessType")
        ));
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(authService.login(
                body.get("email"),
                body.get("password")
        ));
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> me(
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        Long userId = requireUserId(authorization);
        return ResponseEntity.ok(authService.getProfile(userId));
    }

    @GetMapping("/me/history")
    public ResponseEntity<List<Map<String, Object>>> myHistory(
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        Long userId = requireUserId(authorization);
        return ResponseEntity.ok(authService.getMyAnalysisHistory(userId));
    }

    @GetMapping("/me/history/{historyId}")
    public ResponseEntity<Map<String, Object>> historyDetail(
            @PathVariable Long historyId,
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        Long userId = requireUserId(authorization);
        return ResponseEntity.ok(authService.getHistoryDetail(userId, historyId));
    }

    @DeleteMapping("/me/history/{historyId}")
    public ResponseEntity<Void> deleteHistory(
            @PathVariable Long historyId,
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        Long userId = requireUserId(authorization);
        authService.deleteAnalysisHistory(userId, historyId);
        return ResponseEntity.noContent().build();
    }

    /** 신생 창업자 완료 분석 결과를 마이페이지 기록에 저장 */
    @PostMapping("/me/history/new")
    public ResponseEntity<Map<String, Object>> saveNewStartupHistory(
            @RequestBody Map<String, Object> body,
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        Long userId = requireUserId(authorization);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(authService.saveNewStartupHistory(userId, body));
    }

    private Long requireUserId(String authorization) {
        Long userId = jwtService.parseUserId(authorization);
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        return userId;
    }
}
