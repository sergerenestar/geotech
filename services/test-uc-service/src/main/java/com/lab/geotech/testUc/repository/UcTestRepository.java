package com.lab.geotech.testUc.repository;

import com.lab.geotech.testUc.entity.UcTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UcTestRepository extends JpaRepository<UcTest, UUID> {

    List<UcTest> findAllBySampleId(UUID sampleId);

    Page<UcTest> findAllByProjectId(UUID projectId, Pageable pageable);

    Optional<UcTest> findFirstBySampleIdOrderByCreatedAtDesc(UUID sampleId);
}
