package com.lab.geotech.testCbr.service;

import com.lab.geotech.testCbr.constant.TestStatus;
import com.lab.geotech.testCbr.dto.CbrTestCreateDto;
import com.lab.geotech.testCbr.dto.CbrTestResponse;
import com.lab.geotech.testCbr.entity.CbrIntensity;
import com.lab.geotech.testCbr.entity.CbrTest;
import com.lab.geotech.testCbr.exception.InvalidStatusTransitionException;
import com.lab.geotech.testCbr.exception.ResourceNotFoundException;
import com.lab.geotech.testCbr.repository.CbrTestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import static com.lab.geotech.testCbr.constant.TestStatus.*;

@Service
@RequiredArgsConstructor
public class CbrTestService {

    private final CbrTestRepository repository;
    private final CbrCalculationService calculationService;

    private static final Map<TestStatus, Set<TestStatus>> TRANSITIONS = new EnumMap<>(TestStatus.class);
    // Standard mold volume (cm³) for CBR — NF P94-078 cylindrical mold
    private static final BigDecimal MOLD_VOLUME_CM3 = new BigDecimal("2332.0");

    static {
        TRANSITIONS.put(DRAFT,          EnumSet.of(IN_PROGRESS, PENDING_REVIEW));
        TRANSITIONS.put(IN_PROGRESS,    EnumSet.of(PENDING_REVIEW));
        TRANSITIONS.put(PENDING_REVIEW, EnumSet.of(APPROVED, REJECTED, IN_PROGRESS));
        TRANSITIONS.put(APPROVED,       EnumSet.noneOf(TestStatus.class));
        TRANSITIONS.put(REJECTED,       EnumSet.of(IN_PROGRESS));
    }

    @Transactional
    public CbrTestResponse create(CbrTestCreateDto dto, UUID technicianId) {
        BigDecimal rc = dto.ringCoefficient() != null
                ? dto.ringCoefficient()
                : new BigDecimal("0.318");
        BigDecimal gs = dto.specificGravity() != null
                ? dto.specificGravity()
                : new BigDecimal("2.70");

        CbrTest test = CbrTest.builder()
                .projectId(dto.projectId())
                .boreholeId(dto.boreholeId())
                .sampleId(dto.sampleId())
                .technicianId(technicianId)
                .reference(dto.reference())
                .status(IN_PROGRESS)
                .specificGravity(gs)
                .proctorGdmaxTm3(dto.proctorGdmaxTm3())
                .proctorOmcPct(dto.proctorOmcPct())
                .ringCoefficient(rc)
                .notes(dto.notes())
                .build();

        if (dto.intensities() != null) {
            for (var intensityDto : dto.intensities()) {
                CbrIntensity intensity = calculationService.buildIntensity(
                        intensityDto, rc, dto.proctorGdmaxTm3(), MOLD_VOLUME_CM3);
                intensity.setCbrTest(test);
                test.getIntensities().add(intensity);
            }
        }

        return CbrTestResponse.from(repository.save(test));
    }

    @Transactional(readOnly = true)
    public CbrTestResponse getById(UUID id) {
        return CbrTestResponse.from(findOrThrow(id));
    }

    @Transactional(readOnly = true)
    public List<CbrTestResponse> getByProjectId(UUID projectId) {
        return repository.findAllByProjectId(projectId).stream()
                .map(CbrTestResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<CbrTestResponse> getByProjectIdPaged(UUID projectId, Pageable pageable) {
        return repository.findAllByProjectId(projectId, pageable)
                .map(CbrTestResponse::from);
    }

    @Transactional(readOnly = true)
    public List<CbrTestResponse> getBySampleId(UUID sampleId) {
        return repository.findAllBySampleId(sampleId).stream()
                .map(CbrTestResponse::from)
                .toList();
    }

    @Transactional
    public CbrTestResponse update(UUID id, CbrTestCreateDto dto) {
        CbrTest test = findOrThrow(id);
        BigDecimal rc = dto.ringCoefficient() != null ? dto.ringCoefficient() : test.getRingCoefficient();

        test.setReference(dto.reference());
        test.setSpecificGravity(dto.specificGravity() != null ? dto.specificGravity() : test.getSpecificGravity());
        test.setProctorGdmaxTm3(dto.proctorGdmaxTm3());
        test.setProctorOmcPct(dto.proctorOmcPct());
        test.setRingCoefficient(rc);
        test.setNotes(dto.notes());
        test.getIntensities().clear();

        if (dto.intensities() != null) {
            for (var intensityDto : dto.intensities()) {
                CbrIntensity intensity = calculationService.buildIntensity(
                        intensityDto, rc, dto.proctorGdmaxTm3(), MOLD_VOLUME_CM3);
                intensity.setCbrTest(test);
                test.getIntensities().add(intensity);
            }
        }

        return CbrTestResponse.from(repository.save(test));
    }

    @Transactional
    public CbrTestResponse updateStatus(UUID id, TestStatus newStatus) {
        CbrTest test = findOrThrow(id);
        Set<TestStatus> allowed = TRANSITIONS.getOrDefault(test.getStatus(), EnumSet.noneOf(TestStatus.class));
        if (!allowed.contains(newStatus)) {
            throw new InvalidStatusTransitionException(
                    "Cannot transition from " + test.getStatus() + " to " + newStatus);
        }
        test.setStatus(newStatus);
        return CbrTestResponse.from(repository.save(test));
    }

    @Transactional
    public void softDelete(UUID id) {
        CbrTest test = findOrThrow(id);
        test.setDeleted(true);
        repository.save(test);
    }

    private CbrTest findOrThrow(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("CBR test not found: " + id));
    }
}
