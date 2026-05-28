package com.example.sosangworkspace.entity;

import com.example.sosangworkspace.domain.AnalysisStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "analysis_report")
public class AnalysisReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 20)
    private String flowType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private AnalysisStatus status;

    @Lob
    @Column(columnDefinition = "CLOB")
    private String fixedAnswersJson;

    @Lob
    @Column(columnDefinition = "CLOB")
    private String followupAnswersJson;

    @Lob
    @Column(columnDefinition = "CLOB")
    private String apiFactsJson;

    @Lob
    @Column(columnDefinition = "CLOB")
    private String resultJson;

    @Column(length = 500)
    private String errorMessage;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    public Long getId() {
        return id;
    }

    public String getFlowType() {
        return flowType;
    }

    public void setFlowType(String flowType) {
        this.flowType = flowType;
    }

    public AnalysisStatus getStatus() {
        return status;
    }

    public void setStatus(AnalysisStatus status) {
        this.status = status;
    }

    public String getFixedAnswersJson() {
        return fixedAnswersJson;
    }

    public void setFixedAnswersJson(String fixedAnswersJson) {
        this.fixedAnswersJson = fixedAnswersJson;
    }

    public String getFollowupAnswersJson() {
        return followupAnswersJson;
    }

    public void setFollowupAnswersJson(String followupAnswersJson) {
        this.followupAnswersJson = followupAnswersJson;
    }

    public String getApiFactsJson() {
        return apiFactsJson;
    }

    public void setApiFactsJson(String apiFactsJson) {
        this.apiFactsJson = apiFactsJson;
    }

    public String getResultJson() {
        return resultJson;
    }

    public void setResultJson(String resultJson) {
        this.resultJson = resultJson;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
