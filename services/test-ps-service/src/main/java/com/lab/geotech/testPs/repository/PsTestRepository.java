package com.lab.geotech.testPs.repository;

import com.lab.geotech.testPs.entity.PsTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PsTestRepository extends JpaRepository<PsTest, UUID> {
    List<PsTest> findAllBySampleId(UUID sampleId);
    Page<PsTest> findAllByProjectId(UUID projectId, Pageable pageable);
    Optional<PsTest> findFirstBySampleIdOrderByCreatedAtDesc(UUID sampleId);
}
