package com.lab.geotech.project.repository;

import com.lab.geotech.project.entity.Borehole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface BoreholeRepository extends JpaRepository<Borehole, UUID> {
    List<Borehole> findAllByProjectId(UUID projectId);

    @Modifying
    @Query("UPDATE Borehole b SET b.deleted = true WHERE b.project.id = :projectId")
    void softDeleteByProjectId(@Param("projectId") UUID projectId);
}
