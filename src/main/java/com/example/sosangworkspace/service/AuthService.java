package com.example.sosangworkspace.service;

import com.example.sosangworkspace.entity.AnalysisHistory;
import com.example.sosangworkspace.entity.User;
import com.example.sosangworkspace.repository.AnalysisHistoryRepository;
import com.example.sosangworkspace.repository.UserRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final AnalysisHistoryRepository historyRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String STATUS_COMPLETED = "COMPLETED";

    @Transactional
    public Map<String, Object> register(String email, String password, String name, String businessType) {
        String normalizedEmail = normalizeEmail(email);
        validateEmail(normalizedEmail);
        validatePassword(password);

        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 가입된 이메일입니다.");
        }

        User user = new User();
        user.setEmail(normalizedEmail);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setName(name.trim());
        user.setBusinessType(businessType != null ? businessType.trim() : "");

        User saved = userRepository.save(user);
        return buildAuthResponse(saved);
    }

    public Map<String, Object> login(String email, String password) {
        String normalizedEmail = normalizeEmail(email);
        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않습니다."));

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않습니다.");
        }

        return buildAuthResponse(user);
    }

    public Map<String, Object> getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다."));
        return toUserMap(user);
    }

    public List<Map<String, Object>> getMyAnalysisHistory(Long userId) {
        return historyRepository
                .findTop20ByUserIdAndStatusOrderByCreatedAtDesc(userId, STATUS_COMPLETED)
                .stream()
                .map(this::toHistorySummary)
                .toList();
    }

    public Map<String, Object> getHistoryDetail(Long userId, Long historyId) {
        AnalysisHistory history = historyRepository.findByIdAndUserId(historyId, userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "분석 기록을 찾을 수 없습니다."));

        if (!STATUS_COMPLETED.equals(history.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "완료된 분석만 조회할 수 있습니다.");
        }

        String rawJson = history.getLlmResultJson();
        if (rawJson == null || rawJson.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "저장된 분석 결과가 없습니다.");
        }

        Map<String, Object> body = new LinkedHashMap<>(toHistorySummary(history));
        body.put("answers", buildAnswersSnapshot(history));
        try {
            Map<String, Object> result = objectMapper.readValue(
                    rawJson,
                    new TypeReference<Map<String, Object>>() {}
            );
            body.put("result", result);
            body.put("selectedCategories", resolveSelectedCategories(history, result));
        } catch (Exception e) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR, "분석 결과를 불러오지 못했습니다.");
        }
        return body;
    }

    private List<String> resolveSelectedCategories(AnalysisHistory history, Map<String, Object> result) {
        if (history.getSelectedCategoriesJson() != null
                && !history.getSelectedCategoriesJson().isBlank()) {
            try {
                return objectMapper.readValue(
                        history.getSelectedCategoriesJson(),
                        new TypeReference<List<String>>() {}
                );
            } catch (Exception ignored) {
                /* fall through */
            }
        }
        Object fromResult = result.get("selectedCategories");
        if (fromResult instanceof List<?> list) {
            List<String> categories = new java.util.ArrayList<>();
            for (Object item : list) {
                if (item != null) {
                    String text = String.valueOf(item).trim();
                    if (!text.isEmpty()) {
                        categories.add(text);
                    }
                }
            }
            if (!categories.isEmpty()) {
                return categories;
            }
        }
        return List.of();
    }

    private Map<String, String> buildAnswersSnapshot(AnalysisHistory history) {
        Map<String, String> answers = new LinkedHashMap<>();
        putIfPresent(answers, "bizType", history.getBusinessType());
        putIfPresent(answers, "businessType", history.getBusinessType());
        putIfPresent(answers, "region", history.getRegion());
        putIfPresent(answers, "budget", history.getBudgetOrRevenue());
        putIfPresent(answers, "financialScale", history.getBudgetOrRevenue());
        putIfPresent(answers, "storeSize", history.getOperationType());
        putIfPresent(answers, "operationScale", history.getOperationType());
        putIfPresent(answers, "areaType", history.getTargetOrDistrict());
        putIfPresent(answers, "challenge", history.getPrimaryConcern());
        putIfPresent(answers, "primaryConcern", history.getPrimaryConcern());
        return answers;
    }

    private void putIfPresent(Map<String, String> map, String key, String value) {
        if (value != null && !value.isBlank()) {
            map.put(key, value);
        }
    }

    private Map<String, Object> buildAuthResponse(User user) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("accessToken", jwtService.createToken(user.getId(), user.getEmail()));
        body.put("tokenType", "Bearer");
        body.put("user", toUserMap(user));
        return body;
    }

    private Map<String, Object> toUserMap(User user) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", user.getId());
        map.put("email", user.getEmail());
        map.put("name", user.getName());
        map.put("businessType", user.getBusinessType());
        map.put("createdAt", user.getCreatedAt() != null ? user.getCreatedAt().toString() : "");
        return map;
    }

    private Map<String, Object> toHistorySummary(AnalysisHistory history) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", history.getId());
        map.put("userType", history.getUserType());
        map.put("businessType", history.getBusinessType());
        map.put("region", history.getRegion());
        map.put("status", history.getStatus());
        map.put("createdAt", history.getCreatedAt() != null ? history.getCreatedAt().toString() : "");
        return map;
    }

    private String normalizeEmail(String email) {
        if (email == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "이메일을 입력해 주세요.");
        }
        return email.trim().toLowerCase();
    }

    private void validateEmail(String email) {
        if (!email.matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "올바른 이메일 형식이 아닙니다.");
        }
    }

    private void validatePassword(String password) {
        if (password == null || password.length() < 8) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "비밀번호는 8자 이상이어야 합니다.");
        }
    }
}
