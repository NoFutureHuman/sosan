package com.example.sosangworkspace.controller;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

final class AnalysisRequestMaps {

    private AnalysisRequestMaps() {}

    static Map<String, String> toStringMap(Map<String, Object> raw) {
        Map<String, String> out = new LinkedHashMap<>();
        if (raw == null) {
            return out;
        }
        raw.forEach((key, value) -> {
            if (value == null) {
                return;
            }
            if (value instanceof String text) {
                out.put(key, text);
            } else if (value instanceof Number number) {
                out.put(key, number.toString());
            } else if (value instanceof Boolean flag) {
                out.put(key, flag.toString());
            } else if (value instanceof List<?> list) {
                List<String> parts = new ArrayList<>();
                for (Object item : list) {
                    if (item != null) {
                        String text = String.valueOf(item).trim();
                        if (!text.isEmpty()) {
                            parts.add(text);
                        }
                    }
                }
                out.put(key, String.join(", ", parts));
            } else {
                out.put(key, String.valueOf(value));
            }
        });
        return out;
    }
}
