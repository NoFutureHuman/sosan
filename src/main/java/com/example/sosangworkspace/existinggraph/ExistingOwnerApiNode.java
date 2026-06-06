package com.example.sosangworkspace.existinggraph;

import org.bsc.langgraph4j.action.AsyncNodeAction;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Component
class ExistingOwnerApiNode implements AsyncNodeAction<ExistingOwnerGraphState> {

    @Override
    public CompletableFuture<Map<String, Object>> apply(ExistingOwnerGraphState state) {
        return CompletableFuture.completedFuture(Map.of());
    }
}
