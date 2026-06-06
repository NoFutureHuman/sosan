package com.example.sosangworkspace.existinggraph;

import java.util.Collection;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

final class ExistingOwnerTextUtils {

    private ExistingOwnerTextUtils() {
    }

    static String toStr(Object value) {
        if (value == null) {
            return "";
        }
        if (value instanceof Collection<?> collection) {
            StringBuilder sb = new StringBuilder();
            for (Object v : collection) {
                String s = String.valueOf(v).strip();
                if (!s.isEmpty()) {
                    if (!sb.isEmpty()) {
                        sb.append(", ");
                    }
                    sb.append(s);
                }
            }
            return sb.toString();
        }
        return String.valueOf(value);
    }

    static String normalizeQuestionText(Object text) {
        String raw = toStr(text).strip().toLowerCase();
        for (char ch : "?!?.,~·\"'()[]".toCharArray()) {
            raw = raw.replace(String.valueOf(ch), " ");
        }
        return String.join(" ", raw.trim().split("\\s+"));
    }

    static boolean sharesSameQuestionTopic(String a, String b) {
        String left = normalizeQuestionText(a).replace(" ", "");
        String right = normalizeQuestionText(b).replace(" ", "");
        for (var group : ExistingOwnerConstants.QUESTION_TOPIC_KEYWORDS) {
            boolean leftHit = group.stream().anyMatch(left::contains);
            boolean rightHit = group.stream().anyMatch(right::contains);
            if (leftHit && rightHit) {
                return true;
            }
        }
        return false;
    }

    static Set<String> questionTokens(String text) {
        Set<String> tokens = new HashSet<>();
        for (String token : normalizeQuestionText(text).split("\\s+")) {
            if (token.length() >= 2 && !ExistingOwnerConstants.QUESTION_STOP_WORDS.contains(token)) {
                tokens.add(token);
            }
        }
        return tokens;
    }

    static boolean isSimilarQuestion(String a, String b, boolean allowTopicMatch) {
        String left = normalizeQuestionText(a);
        String right = normalizeQuestionText(b);
        if (left.isEmpty() || right.isEmpty()) {
            return false;
        }
        if (left.equals(right) || left.contains(right) || right.contains(left)) {
            return true;
        }

        Set<String> leftTokens = questionTokens(left);
        Set<String> rightTokens = questionTokens(right);
        if (leftTokens.isEmpty() || rightTokens.isEmpty()) {
            return false;
        }

        Set<String> intersection = new HashSet<>(leftTokens);
        intersection.retainAll(rightTokens);
        Set<String> union = new HashSet<>(leftTokens);
        union.addAll(rightTokens);

        if (!union.isEmpty() && (double) intersection.size() / union.size() >= 0.42) {
            return true;
        }

        long coreOverlap = intersection.stream().filter(t -> t.length() >= 3).count();
        if (coreOverlap >= 2) {
            return true;
        }

        int shorter = Math.min(leftTokens.size(), rightTokens.size());
        if (shorter > 0 && (double) intersection.size() / shorter >= 0.55) {
            return true;
        }

        if (allowTopicMatch && sharesSameQuestionTopic(left, right) && !intersection.isEmpty()) {
            return true;
        }

        return false;
    }

    static int countFollowupAnswers(Map<String, Object> answers) {
        int count = 0;
        if (answers == null) {
            return 0;
        }
        for (Map.Entry<String, Object> entry : answers.entrySet()) {
            String key = entry.getKey();
            if (key == null || !key.startsWith("followup_") || key.startsWith("followup_question_")) {
                continue;
            }
            if (!toStr(entry.getValue()).strip().isEmpty()) {
                count++;
            }
        }
        return count;
    }

    static String normalizeCategoryLabel(String text) {
        return toStr(text).strip().replace(" ", "").toLowerCase();
    }

    static int scorePresence(Object... values) {
        int nonEmpty = 0;
        for (Object v : values) {
            if (!toStr(v).strip().isEmpty()) {
                nonEmpty++;
            }
        }
        return (int) ((double) nonEmpty / Math.max(1, values.length) * 100);
    }
}
