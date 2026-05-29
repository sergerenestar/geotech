package com.lab.geotech.testSg.repository;

import com.lab.geotech.testSg.entity.SgTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SgTestRepository extends JpaRepository<SgTest, UUID> {
    List<SgTest> findAllBySampleId(UUID sampleId);
    Page<SgTest> findAllByProjectId(UUID projectId, Pageable pageable);
    Optional<SgTest> findFirstBySampleIdOrderByCreatedAtDesc(UUID sampleId);
}
