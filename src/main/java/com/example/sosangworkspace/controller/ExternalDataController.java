package com.example.sosangworkspace.controller;

import com.example.sosangworkspace.service.ExternalApiService;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/external")
@CrossOrigin(origins = "*")
public class ExternalDataController {

    private final ExternalApiService externalApiService;

    public ExternalDataController(ExternalApiService externalApiService) {
        this.externalApiService = externalApiService;
    }

    @GetMapping("/commercial")
    public ResponseEntity<?> getCommercial(
            @RequestParam String regionText,
            @RequestParam String sigunguCode
    ) {
        Map<String, Object> result = externalApiService.fetchCommercialContext(regionText, sigunguCode);
        if (result == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/sbiz")
    public ResponseEntity<?> getSbiz(
            @RequestParam String regionText,
            @RequestParam String sigunguCode,
            @RequestParam(required = false, defaultValue = "") String bizCategory
    ) {
        Map<String, Object> result = externalApiService.fetchSbizStores(regionText, sigunguCode, bizCategory);
        if (result == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/rone")
    public ResponseEntity<?> getRone(@RequestParam String regionText) {
        Map<String, Object> result = externalApiService.fetchRoneRentData(regionText);
        if (result == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/bizinfo")
    public ResponseEntity<?> getBizinfo(@RequestParam(required = false, defaultValue = "") String bizType) {
        Map<String, Object> result = externalApiService.fetchBizinfoSupport(bizType);
        if (result == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(result);
    }
}
