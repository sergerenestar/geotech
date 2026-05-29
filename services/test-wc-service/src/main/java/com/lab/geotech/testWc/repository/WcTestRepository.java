package com.lab.geotech.testWc.repository;

import com.lab.geotech.testWc.entity.WcTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WcTestRepository extends JpaRepository<WcTest, UUID> {
    List<WcTest> findAllBySampleId(UUID sampleId);
    Page<WcTest> findAllByProjectId(UUID projectId, Pageable pageable);
    Page<WcTest> findAllByTechnicianId(UUID technicianId, Pageable pageable);
    Optional<WcTest> findFirstBySampleIdOrderByCreatedAtDesc(UUID sampleId);
}
