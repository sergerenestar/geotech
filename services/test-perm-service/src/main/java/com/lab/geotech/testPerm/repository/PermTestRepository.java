package com.lab.geotech.testPerm.repository;

import com.lab.geotech.testPerm.entity.PermTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PermTestRepository extends JpaRepository<PermTest, UUID> {

    List<PermTest> findAllBySampleId(UUID sampleId);

    Page<PermTest> findAllByProjectId(UUID projectId, Pageable pageable);

    Optional<PermTest> findFirstBySampleIdOrderByCreatedAtDesc(UUID sampleId);
}
