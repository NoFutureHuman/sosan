package com.example.sosangworkspace.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Getter @Setter
@Table(name = "analysis_history")
public class AnalysisHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    private String userType;
    private String businessType;
    private String region;
    private String budgetOrRevenue;
    private String operationType;
    private String targetOrDistrict;
    private String primaryConcern;

    @Column(columnDefinition = "TEXT")
    private String llmResultJson;

    /** JSON array: ["매출 성과","마케팅 역량",...] */
    @Column(name = "selected_categories_json", columnDefinition = "TEXT")
    private String selectedCategoriesJson;

    private String status;

    @Column(updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}