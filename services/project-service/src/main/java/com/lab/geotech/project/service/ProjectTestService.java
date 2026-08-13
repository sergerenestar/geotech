package com.lab.geotech.project.service;

import com.lab.geotech.project.constant.TestType;
import com.lab.geotech.project.constant.WorkflowStatus;
import com.lab.geotech.project.dto.ProjectTestAssignDto;
import com.lab.geotech.project.dto.ProjectTestResponse;
import com.lab.geotech.project.dto.ProjectTestSetDto;
import com.lab.geotech.project.entity.ProjectTest;
import com.lab.geotech.project.repository.ProjectTestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Manages the test catalogue for a project — the set of test types requested and their assignments.
 *
 * <p>The test catalogue is the list of {@link ProjectTest} rows associated with a project.
 * Setting the catalogue ({@link #setProjectTests}) is a replace-all operation: the existing
 * catalogue is deleted and rebuilt from scratch in a single transaction, which is safe because
 * test-result data lives in separate service schemas.
 */
@Service
@RequiredArgsConstructor
public class ProjectTestService {

    private final ProjectTestRepository repo;

    /** Returns all tests in the catalogue for the given project. */
    public List<ProjectTestResponse> getByProject(UUID projectId) {
        return repo.findByProjectId(projectId).stream()
                .map(ProjectTestResponse::from)
                .toList();
    }

    /**
     * Replaces the project's entire test catalogue with the supplied list.
     *
     * <p>All existing {@code ProjectTest} rows for the project are deleted first, then new
     * ones are inserted. This means any in-flight workflow state (technician assignments,
     * workflow status) is lost when the catalogue is reset — callers should warn the user.
     *
     * @param projectId Target project.
     * @param dto       New list of test types and the lab manager UUID to attach to each.
     */
    @Transactional
    public List<ProjectTestResponse> setProjectTests(UUID projectId, ProjectTestSetDto dto) {
        repo.deleteByProjectId(projectId);

        List<ProjectTest> saved = dto.testTypes().stream()
                .map(raw -> {
                    TestType type = parseType(raw);
                    return ProjectTest.builder()
                            .projectId(projectId)
                            .testType(type)
                            .labManagerId(dto.labManagerId())
                            .build();
                })
                .map(repo::save)
                .toList();

        return saved.stream().map(ProjectTestResponse::from).toList();
    }

    /** Removes a single test type from the catalogue. Throws if the type is not present. */
    @Transactional
    public void removeOne(UUID projectId, String testTypeRaw) {
        TestType type = parseType(testTypeRaw);
        repo.findByProjectIdAndTestType(projectId, type)
                .orElseThrow(() -> new RuntimeException("Test type " + type + " not found in project catalogue"));
        repo.deleteByProjectIdAndTestType(projectId, type);
    }

    /**
     * Assigns or reassigns a technician to a test, setting priority and deadline.
     *
     * <p>If the workflow has not yet started (status is null or ASSIGNED) the status is
     * kept/reset to ASSIGNED. If the workflow has already progressed beyond ASSIGNED
     * (e.g. IN_PROGRESS) the assignment is updated without resetting the workflow state,
     * so that an LM can adjust deadline/priority mid-flight.
     */
    @Transactional
    public ProjectTestResponse assignTechnician(UUID projectId, UUID testId, ProjectTestAssignDto dto) {
        ProjectTest pt = repo.findById(testId)
                .filter(t -> t.getProjectId().equals(projectId))
                .orElseThrow(() -> new RuntimeException("Test not found in project"));
        pt.setTechnicianId(dto.technicianId());
        pt.setPriority(dto.priority());
        pt.setDeadline(dto.deadline() != null && !dto.deadline().isBlank()
                ? LocalDate.parse(dto.deadline()) : null);
        // Reset to ASSIGNED whenever a (new) technician is assigned, unless workflow has progressed
        if (pt.getWorkflowStatus() == null || pt.getWorkflowStatus() == WorkflowStatus.ASSIGNED) {
            pt.setWorkflowStatus(WorkflowStatus.ASSIGNED);
        }
        return ProjectTestResponse.from(repo.save(pt));
    }

    /** Replaces the lab manager on a test without affecting technician assignment or workflow state. */
    @Transactional
    public ProjectTestResponse updateLabManager(UUID projectId, String testTypeRaw, UUID labManagerId) {
        TestType type = parseType(testTypeRaw);
        ProjectTest pt = repo.findByProjectIdAndTestType(projectId, type)
                .orElseThrow(() -> new RuntimeException("Test type " + type + " not found in project catalogue"));
        pt.setLabManagerId(labManagerId);
        return ProjectTestResponse.from(repo.save(pt));
    }

    /** Parses a raw string to a {@link TestType} enum constant, throwing a descriptive error on unknown input. */
    private TestType parseType(String raw) {
        try {
            return TestType.valueOf(raw.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Unknown test type: " + raw);
        }
    }
}
