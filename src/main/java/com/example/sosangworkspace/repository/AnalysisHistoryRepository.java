package com.example.sosangworkspace.repository;

import com.example.sosangworkspace.entity.AnalysisHistory;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AnalysisHistoryRepository extends JpaRepository<AnalysisHistory, Long> {

    List<AnalysisHistory> findTop20ByUserIdAndStatusOrderByCreatedAtDesc(Long userId, String status);

    Optional<AnalysisHistory> findByIdAndUserId(Long id, Long userId);
}
