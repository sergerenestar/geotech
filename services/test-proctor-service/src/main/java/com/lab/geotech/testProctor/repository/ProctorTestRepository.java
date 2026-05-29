package com.lab.geotech.testProctor.repository;

import com.lab.geotech.testProctor.entity.ProctorTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProctorTestRepository extends JpaRepository<ProctorTest, UUID> {

    List<ProctorTest> findAllBySampleId(UUID sampleId);

    Page<ProctorTest> findAllByProjectId(UUID projectId, Pageable pageable);

    Optional<ProctorTest> findFirstBySampleIdOrderByCreatedAtDesc(UUID sampleId);
}
