package com.example.sosangworkspace.existinggraph;

import org.bsc.langgraph4j.state.AgentState;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * LangGraph4j 그래프 전체에서 공유되는 기존 사장님 분석 상태.
 */
public class ExistingOwnerGraphState extends AgentState {

    public ExistingOwnerGraphState(Map<String, Object> initData) {
        super(initData);
    }

    @SuppressWarnings("unchecked")
    public Optional<Map<String, Object>> answers() {
        return value("answers");
    }

    @SuppressWarnings("unchecked")
    public Optional<Map<String, Object>> apiFacts() {
        return value("apiFacts");
    }

    public Optional<String> flowType() {
        return value("flowType");
    }

    @SuppressWarnings("unchecked")
    public Optional<List<String>> selectedCategories() {
        return value("selectedCategories");
    }

    @SuppressWarnings("unchecked")
    public Optional<Map<String, Object>> ragScores() {
        return value("ragScores");
    }

    @SuppressWarnings("unchecked")
    public Optional<Map<String, Object>> questionResult() {
        return value("questionResult");
    }

    @SuppressWarnings("unchecked")
    public Optional<Map<String, Object>> reportResult() {
        return value("reportResult");
    }

    @SuppressWarnings("unchecked")
    public Optional<Map<String, Object>> llmResult() {
        return value("llmResult");
    }
}
