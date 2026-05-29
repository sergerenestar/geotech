package com.lab.geotech.testCbr.repository;

import com.lab.geotech.testCbr.entity.CbrTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CbrTestRepository extends JpaRepository<CbrTest, UUID> {
    List<CbrTest> findAllByProjectId(UUID projectId);
    Page<CbrTest> findAllByProjectId(UUID projectId, Pageable pageable);
    List<CbrTest> findAllBySampleId(UUID sampleId);
}
