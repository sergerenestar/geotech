package com.lab.geotech.testLl.repository;

import com.lab.geotech.testLl.entity.LlTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LlTestRepository extends JpaRepository<LlTest, UUID> {
    List<LlTest> findAllBySampleId(UUID sampleId);
    Page<LlTest> findAllByProjectId(UUID projectId, Pageable pageable);
    Optional<LlTest> findFirstBySampleIdOrderByCreatedAtDesc(UUID sampleId);
}
