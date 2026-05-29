package com.lab.geotech.project.service;

import com.lab.geotech.project.constant.ProjectStatus;
import com.lab.geotech.project.dto.PagedResponse;
import com.lab.geotech.project.dto.ProjectCreateDto;
import com.lab.geotech.project.dto.ProjectResponse;
import com.lab.geotech.project.entity.Project;
import com.lab.geotech.project.exception.InvalidStatusTransitionException;
import com.lab.geotech.project.exception.ProjectNotFoundException;
import com.lab.geotech.project.repository.BoreholeRepository;
import com.lab.geotech.project.repository.ProjectRepository;
import com.lab.geotech.project.repository.SampleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectCodeService codeService;
    private final BoreholeRepository boreholeRepository;
    private final SampleRepository sampleRepository;

    private static final java.util.Map<ProjectStatus, Set<ProjectStatus>> VALID_TRANSITIONS = java.util.Map.of(
            ProjectStatus.DRAFT,          Set.of(ProjectStatus.ACTIVE, ProjectStatus.CANCELLED),
            ProjectStatus.ACTIVE,         Set.of(ProjectStatus.ON_HOLD, ProjectStatus.PENDING_REVIEW, ProjectStatus.CANCELLED),
            ProjectStatus.ON_HOLD,        Set.of(ProjectStatus.ACTIVE, ProjectStatus.CANCELLED),
            ProjectStatus.PENDING_REVIEW, Set.of(ProjectStatus.COMPLETED, ProjectStatus.ACTIVE),
            ProjectStatus.COMPLETED,      Set.of(ProjectStatus.ARCHIVED),
            ProjectStatus.ARCHIVED,       Set.of(),
            ProjectStatus.CANCELLED,      Set.of()
    );

    @Transactional
    public ProjectResponse createProject(ProjectCreateDto dto, UUID createdBy) {
        String code = codeService.nextCode();
        Project project = Project.builder()
                .projectCode(code)
                .name(dto.name())
                .description(dto.description())
                .status(ProjectStatus.DRAFT)
                .clientId(dto.clientId())
                .locationId(dto.locationId())
                .createdBy(createdBy)
                .deleted(false)
                .build();
        return ProjectResponse.from(projectRepository.save(project));
    }

    public PagedResponse<ProjectResponse> getMyProjects(UUID userId, int page, int size) {
        Page<Project> projects = projectRepository.findAllByCreatedBy(userId, PageRequest.of(page, size));
        return PagedResponse.of(
                projects.getContent().stream().map(ProjectResponse::from).toList(),
                projects.getTotalElements(), page, size
        );
    }

    public PagedResponse<ProjectResponse> getAllProjects(int page, int size) {
        Page<Project> projects = projectRepository.findAll(PageRequest.of(page, size));
        return PagedResponse.of(
                projects.getContent().stream().map(ProjectResponse::from).toList(),
                projects.getTotalElements(), page, size
        );
    }

    public ProjectResponse getById(UUID id) {
        return projectRepository.findById(id)
                .map(ProjectResponse::from)
                .orElseThrow(() -> new ProjectNotFoundException(id));
    }

    @Transactional
    public ProjectResponse updateStatus(UUID id, ProjectStatus newStatus) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ProjectNotFoundException(id));
        Set<ProjectStatus> allowed = VALID_TRANSITIONS.getOrDefault(project.getStatus(), Set.of());
        if (!allowed.contains(newStatus)) {
            throw new InvalidStatusTransitionException(project.getStatus(), newStatus);
        }
        project.setStatus(newStatus);
        return ProjectResponse.from(projectRepository.save(project));
    }

    @Transactional
    public void softDelete(UUID id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ProjectNotFoundException(id));
        sampleRepository.softDeleteByProjectId(id);
        boreholeRepository.softDeleteByProjectId(id);
        project.setDeleted(true);
        projectRepository.save(project);
    }
}
