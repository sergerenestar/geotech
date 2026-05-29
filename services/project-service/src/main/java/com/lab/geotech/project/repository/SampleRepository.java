package com.lab.geotech.project.repository;

import com.lab.geotech.project.entity.Sample;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface SampleRepository extends JpaRepository<Sample, UUID> {
    List<Sample> findAllByBoreholeId(UUID boreholeId);

    @Modifying
    @Query("UPDATE Sample s SET s.deleted = true WHERE s.borehole.id IN (SELECT b.id FROM Borehole b WHERE b.project.id = :projectId)")
    void softDeleteByProjectId(@Param("projectId") UUID projectId);
}
