package com.example.sosangworkspace.existinggraph;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

final class ExistingOwnerJsonUtils {

    private static final ObjectMapper COMPACT_MAPPER = new ObjectMapper();
    private static final Pattern CODE_FENCE_RE = Pattern.compile("```(?:json)?\\s*([\\s\\S]*?)\\s*```", Pattern.CASE_INSENSITIVE);
    private static final Pattern TRAILING_COMMA_RE = Pattern.compile(",(\\s*[}\\]])");

    private ExistingOwnerJsonUtils() {
    }

    static String toCompactJson(Object value) {
        try {
            return COMPACT_MAPPER.writeValueAsString(value);
        } catch (Exception e) {
            return String.valueOf(value);
        }
    }

    @SuppressWarnings("unchecked")
    static Map<String, Object> parseJsonObject(String raw) {
        Object parsed = loadsJsonLenient(raw);
        if (parsed instanceof Map<?, ?> map) {
            return (Map<String, Object>) map;
        }
        throw new RuntimeException("NOT_OBJECT");
    }

    static Object loadsJsonLenient(String raw) {
        Exception lastExc = null;
        List<String> candidates = new ArrayList<>();
        String stripped = raw == null ? "" : raw.strip();
        if (!stripped.isEmpty()) {
            candidates.add(stripped);
        }
        String extracted = extractJsonObjectText(raw);
        if (!extracted.isEmpty() && !candidates.contains(extracted)) {
            candidates.add(extracted);
        }

        for (String text : candidates) {
            for (String variant : List.of(text, sanitizeJsonText(text))) {
                if (variant == null || variant.isBlank()) {
                    continue;
                }
                try {
                    return COMPACT_MAPPER.readValue(variant, new TypeReference<Object>() {});
                } catch (Exception exc) {
                    lastExc = exc;
                }
            }
        }
        if (lastExc != null) {
            throw new RuntimeException(lastExc);
        }
        throw new RuntimeException("empty JSON payload");
    }

    static String extractJsonObjectText(String raw) {
        String text = raw == null ? "" : raw.strip();
        if (text.isEmpty()) {
            return text;
        }
        Matcher fence = CODE_FENCE_RE.matcher(text);
        if (fence.find()) {
            text = fence.group(1).strip();
        }
        int start = text.indexOf('{');
        int end = text.lastIndexOf('}');
        if (start != -1 && end != -1 && end > start) {
            return text.substring(start, end + 1);
        }
        return text;
    }

    static String sanitizeJsonText(String text) {
        String cleaned = text == null ? "" : text.strip();
        String prev = null;
        while (!cleaned.equals(prev)) {
            prev = cleaned;
            cleaned = TRAILING_COMMA_RE.matcher(cleaned).replaceAll("$1");
        }
        return cleaned;
    }
}
