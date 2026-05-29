package com.lab.geotech.testConsol.repository;

import com.lab.geotech.testConsol.entity.ConsolTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ConsolTestRepository extends JpaRepository<ConsolTest, UUID> {

    List<ConsolTest> findAllBySampleId(UUID sampleId);

    Page<ConsolTest> findAllByProjectId(UUID projectId, Pageable pageable);

    Optional<ConsolTest> findFirstBySampleIdOrderByCreatedAtDesc(UUID sampleId);
}
