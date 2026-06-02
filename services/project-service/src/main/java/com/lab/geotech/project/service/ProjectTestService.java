package com.lab.geotech.project.service;

import com.lab.geotech.project.constant.TestType;
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

@Service
@RequiredArgsConstructor
public class ProjectTestService {

    private final ProjectTestRepository repo;

    public List<ProjectTestResponse> getByProject(UUID projectId) {
        return repo.findByProjectId(projectId).stream()
                .map(ProjectTestResponse::from)
                .toList();
    }

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

    @Transactional
    public void removeOne(UUID projectId, String testTypeRaw) {
        TestType type = parseType(testTypeRaw);
        repo.findByProjectIdAndTestType(projectId, type)
                .orElseThrow(() -> new RuntimeException("Test type " + type + " not found in project catalogue"));
        repo.deleteByProjectIdAndTestType(projectId, type);
    }

    @Transactional
    public ProjectTestResponse assignTechnician(UUID projectId, UUID testId, ProjectTestAssignDto dto) {
        ProjectTest pt = repo.findById(testId)
                .filter(t -> t.getProjectId().equals(projectId))
                .orElseThrow(() -> new RuntimeException("Test not found in project"));
        pt.setTechnicianId(dto.technicianId());
        pt.setPriority(dto.priority());
        pt.setDeadline(dto.deadline() != null && !dto.deadline().isBlank()
                ? LocalDate.parse(dto.deadline()) : null);
        return ProjectTestResponse.from(repo.save(pt));
    }

    @Transactional
    public ProjectTestResponse updateLabManager(UUID projectId, String testTypeRaw, UUID labManagerId) {
        TestType type = parseType(testTypeRaw);
        ProjectTest pt = repo.findByProjectIdAndTestType(projectId, type)
                .orElseThrow(() -> new RuntimeException("Test type " + type + " not found in project catalogue"));
        pt.setLabManagerId(labManagerId);
        return ProjectTestResponse.from(repo.save(pt));
    }

    private TestType parseType(String raw) {
        try {
            return TestType.valueOf(raw.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Unknown test type: " + raw);
        }
    }
}
