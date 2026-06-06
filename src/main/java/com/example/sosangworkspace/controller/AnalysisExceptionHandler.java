package com.example.sosangworkspace.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class AnalysisExceptionHandler {

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleException(Exception e) {
        String message = e.getMessage() != null ? e.getMessage() : "서버 내부 오류";
        if ("AI_NOT_CONNECTED".equals(message)) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of(
                    "type", "error",
                    "message",
                    "OpenAI API 키가 설정되지 않았습니다. "
                            + "sosan-main/src/main/resources/application.properties 의 openai.api.key 를 확인해 주세요."
            ));
        }
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "type", "error",
                "message", message
        ));
    }
}
