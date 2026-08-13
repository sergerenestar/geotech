package com.lab.geotech.project.service;

import com.lab.geotech.project.dto.BoreholeCreateDto;
import com.lab.geotech.project.dto.BoreholeResponse;
import com.lab.geotech.project.entity.Borehole;
import com.lab.geotech.project.entity.Project;
import com.lab.geotech.project.exception.ProjectNotFoundException;
import com.lab.geotech.project.exception.ResourceNotFoundException;
import com.lab.geotech.project.repository.BoreholeRepository;
import com.lab.geotech.project.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Business logic for boreholes — the second level of the domain hierarchy
 * projects → boreholes (BH-01, BH-02, …) → samples → test results.
 *
 * <p>A borehole belongs to exactly one project. It has an optional GPS location
 * (latitude/longitude) and groundwater depth reading recorded at drilling time.
 * Soft-delete cascades from the parent project via
 * {@link ProjectService#softDelete}, but individual boreholes can also be
 * soft-deleted independently.
 */
@Service
@RequiredArgsConstructor
public class BoreholeService {

    private final BoreholeRepository boreholeRepository;
    private final ProjectRepository projectRepository;

    public List<BoreholeResponse> getByProject(UUID projectId) {
        return boreholeRepository.findAllByProjectId(projectId).stream()
                .map(BoreholeResponse::from).toList();
    }

    public BoreholeResponse getById(UUID id) {
        return boreholeRepository.findById(id)
                .map(BoreholeResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("Borehole", id));
    }

    @Transactional
    public BoreholeResponse create(BoreholeCreateDto dto, UUID createdBy) {
        Project project = projectRepository.findById(dto.projectId())
                .orElseThrow(() -> new ProjectNotFoundException(dto.projectId()));
        Borehole borehole = Borehole.builder()
                .project(project)
                .bhCode(dto.bhCode())
                .depthM(dto.depthM())
                .latitude(dto.latitude())
                .longitude(dto.longitude())
                .groundwaterDepthM(dto.groundwaterDepthM())
                .notes(dto.notes())
                .createdBy(createdBy)
                .deleted(false)
                .build();
        return BoreholeResponse.from(boreholeRepository.save(borehole));
    }

    @Transactional
    public void softDelete(UUID id) {
        Borehole borehole = boreholeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Borehole", id));
        borehole.setDeleted(true);
        boreholeRepository.save(borehole);
    }
}
