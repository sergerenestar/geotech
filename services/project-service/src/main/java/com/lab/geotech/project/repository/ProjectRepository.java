package com.lab.geotech.project.repository;

import com.lab.geotech.project.entity.Project;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

/**
 * Repository for the {@link Project} entity.
 *
 * <p>The {@code @Where(clause = "is_deleted = false")} on the entity is automatically applied
 * to all JPQL/derived queries. The native query {@link #findLastCodeByPrefix} intentionally
 * bypasses this filter to prevent reuse of codes from soft-deleted projects.
 *
 * <p>Lab-manager and technician project lists are resolved via sub-selects on
 * {@code project_tests} rather than a direct FK column on {@code projects}, because
 * a project can have multiple test types assigned to different lab managers.
 */
public interface ProjectRepository extends JpaRepository<Project, UUID> {

    /** Projects created by a specific user (= that user's PM project list). */
    Page<Project> findAllByCreatedBy(UUID createdBy, Pageable pageable);

    Page<Project> findAllByClientId(UUID clientId, Pageable pageable);
    long countByClientId(UUID clientId);

    /**
     * Projects that have at least one test assigned to the given lab manager.
     * Uses a sub-select rather than a join to avoid duplicates when multiple tests
     * in the same project are assigned to the same manager.
     */
    @Query("SELECT p FROM Project p WHERE p.id IN " +
           "(SELECT pt.projectId FROM ProjectTest pt WHERE pt.labManagerId = :labManagerId)")
    Page<Project> findAllByLabManagerId(@Param("labManagerId") UUID labManagerId, Pageable pageable);

    /**
     * Projects that have at least one test assigned to the given technician.
     * Same sub-select pattern as {@link #findAllByLabManagerId}.
     */
    @Query("SELECT p FROM Project p WHERE p.id IN " +
           "(SELECT pt.projectId FROM ProjectTest pt WHERE pt.technicianId = :technicianId)")
    Page<Project> findAllByTechnicianId(@Param("technicianId") UUID technicianId, Pageable pageable);

    /**
     * Returns the lexicographically last project code matching the given year prefix pattern.
     * Native SQL intentionally bypasses {@code @Where(is_deleted = false)} so that codes
     * from soft-deleted projects are never recycled.
     */
    @Query(value = "SELECT project_code FROM projects.projects WHERE project_code LIKE :prefix ORDER BY project_code DESC LIMIT 1", nativeQuery = true)
    Optional<String> findLastCodeByPrefix(String prefix);
}
