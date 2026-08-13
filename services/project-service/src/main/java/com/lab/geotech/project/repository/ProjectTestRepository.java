package com.lab.geotech.project.repository;

import com.lab.geotech.project.constant.TestType;
import com.lab.geotech.project.constant.WorkflowStatus;
import com.lab.geotech.project.entity.ProjectTest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for the {@link ProjectTest} entity — each row is one test type in a project's catalogue.
 *
 * <p>Workflow queue queries ({@code findBy*AndWorkflowStatusIn}) are used by
 * {@link com.lab.geotech.project.service.TestWorkflowService} to populate each actor's
 * active and completed test lists.
 *
 * <p>The PM query ({@link #findByPmAndWorkflowStatusIn}) cannot use a simple FK lookup
 * because the PM is identified as {@code Project.createdBy}, not a direct column on
 * {@code project_tests}. A sub-select on {@code projects} is therefore required.
 * The explicit {@code p.deleted = false} guard is needed because the JPQL sub-select does
 * not inherit the entity-level {@code @Where} filter.
 */
public interface ProjectTestRepository extends JpaRepository<ProjectTest, UUID> {

    List<ProjectTest> findByProjectId(UUID projectId);

    Optional<ProjectTest> findByProjectIdAndTestType(UUID projectId, TestType testType);

    /** Deletes the entire test catalogue for a project (used when resetting via {@code setProjectTests}). */
    void deleteByProjectId(UUID projectId);

    void deleteByProjectIdAndTestType(UUID projectId, TestType testType);

    /** Workflow queue for technicians: tests assigned to them in the given statuses. */
    List<ProjectTest> findByTechnicianIdAndWorkflowStatusIn(UUID technicianId, List<WorkflowStatus> statuses);

    /** Workflow queue for lab managers. */
    List<ProjectTest> findByLabManagerIdAndWorkflowStatusIn(UUID labManagerId, List<WorkflowStatus> statuses);

    /**
     * Workflow queue for project managers.
     *
     * <p>Sub-selects through {@code Project} to identify tests owned by projects where
     * {@code createdBy = pmId}. Includes {@code p.deleted = false} because JPQL sub-queries
     * do not automatically apply Hibernate's entity-level {@code @Where} filter.
     */
    @Query("SELECT pt FROM ProjectTest pt WHERE pt.workflowStatus IN :statuses " +
           "AND pt.projectId IN (SELECT p.id FROM Project p WHERE p.createdBy = :pmId AND p.deleted = false)")
    List<ProjectTest> findByPmAndWorkflowStatusIn(@Param("pmId") UUID pmId,
                                                  @Param("statuses") List<WorkflowStatus> statuses);
}
