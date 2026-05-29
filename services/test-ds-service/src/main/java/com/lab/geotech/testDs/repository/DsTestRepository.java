package com.lab.geotech.testDs.repository;

import com.lab.geotech.testDs.entity.DsTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DsTestRepository extends JpaRepository<DsTest, UUID> {

    List<DsTest> findAllBySampleId(UUID sampleId);

    Page<DsTest> findAllByProjectId(UUID projectId, Pageable pageable);

    Optional<DsTest> findFirstBySampleIdOrderByCreatedAtDesc(UUID sampleId);
}
