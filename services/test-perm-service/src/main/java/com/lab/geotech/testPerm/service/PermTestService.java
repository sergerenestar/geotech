package com.lab.geotech.testPerm.service;

import com.lab.geotech.testPerm.constant.AiFlag;
import com.lab.geotech.testPerm.constant.TestStatus;
import com.lab.geotech.testPerm.constant.TestType;
import com.lab.geotech.testPerm.dto.PermTestCreateDto;
import com.lab.geotech.testPerm.dto.PermTestResponse;
import com.lab.geotech.testPerm.entity.PermReading;
import com.lab.geotech.testPerm.entity.PermTest;
import com.lab.geotech.testPerm.exception.InvalidStatusTransitionException;
import com.lab.geotech.testPerm.exception.ResourceNotFoundException;
import com.lab.geotech.testPerm.repository.PermTestRepository;
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
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static com.lab.geotech.testPerm.constant.TestStatus.*;

@Service
@RequiredArgsConstructor
public class PermTestService {

    private final PermTestRepository repository;
    private final PermCalculationService calculationService;
    private final PermAnomalyService anomalyService;

    private static final BigDecimal DEFAULT_WATER_TEMP = new BigDecimal("20.0");

    private static final Map<TestStatus, Set<TestStatus>> TRANSITIONS = new EnumMap<>(TestStatus.class);

    static {
        TRANSITIONS.put(DRAFT, EnumSet.of(IN_PROGRESS, PENDING_REVIEW));
        TRANSITIONS.put(IN_PROGRESS, EnumSet.of(PENDING_REVIEW));
        TRANSITIONS.put(PENDING_REVIEW, EnumSet.of(APPROVED, REJECTED, IN_PROGRESS));
        TRANSITIONS.put(APPROVED, EnumSet.noneOf(TestStatus.class));
        TRANSITIONS.put(REJECTED, EnumSet.of(IN_PROGRESS));
    }

    @Transactional
    public PermTestResponse create(PermTestCreateDto dto, UUID technicianId) {
        PermTest test = buildTest(dto, technicianId);
        populateReadings(test, dto);
        calculationService.calculate(test, dto.readings());
        anomalyService.analyze(test);
        return PermTestResponse.from(repository.save(test));
    }

    @Transactional(readOnly = true)
    public PermTestResponse getById(UUID id) {
        return PermTestResponse.from(findOrThrow(id));
    }

    @Transactional(readOnly = true)
    public List<PermTestResponse> getBySampleId(UUID sampleId) {
        return repository.findAllBySampleId(sampleId).stream()
                .map(PermTestResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public Page<PermTestResponse> getByProjectId(UUID projectId, Pageable pageable) {
        return repository.findAllByProjectId(projectId, pageable).map(PermTestResponse::from);
    }

    @Transactional
    public PermTestResponse updateStatus(UUID id, TestStatus newStatus) {
        PermTest test = findOrThrow(id);
        Set<TestStatus> allowed = TRANSITIONS.getOrDefault(test.getStatus(), EnumSet.noneOf(TestStatus.class));
        if (!allowed.contains(newStatus)) {
            throw new InvalidStatusTransitionException(
                    "Cannot transition from " + test.getStatus() + " to " + newStatus);
        }
        test.setStatus(newStatus);
        return PermTestResponse.from(repository.save(test));
    }

    @Transactional(readOnly = true)
    public Optional<PermTestResponse> getLatestBySampleId(UUID sampleId) {
        return repository.findFirstBySampleIdOrderByCreatedAtDesc(sampleId)
                .map(PermTestResponse::from);
    }

    @Transactional
    public void softDelete(UUID id) {
        PermTest test = findOrThrow(id);
        test.setDeleted(true);
        repository.save(test);
    }

    @Transactional
    public PermTestResponse update(UUID id, PermTestCreateDto dto) {
        PermTest test = findOrThrow(id);
        test.setSpecimenDiameterMm(dto.specimenDiameterMm());
        test.setSpecimenLengthMm(dto.specimenLengthMm());
        test.setWaterTemperatureC(dto.waterTemperatureC() != null ? dto.waterTemperatureC() : DEFAULT_WATER_TEMP);
        test.setTestType(dto.testType() != null ? dto.testType() : TestType.CONSTANT_HEAD);
        test.setStandpipeAreaCm2(dto.standpipeAreaCm2());
        test.setHeadCm(dto.headCm());
        test.setNotes(dto.notes());
        test.getReadings().clear();
        populateReadings(test, dto);
        calculationService.calculate(test, dto.readings());
        anomalyService.analyze(test);
        return PermTestResponse.from(repository.save(test));
    }

    private PermTest buildTest(PermTestCreateDto dto, UUID technicianId) {
        return PermTest.builder()
                .sampleId(dto.sampleId())
                .projectId(dto.projectId())
                .boreholeId(dto.boreholeId())
                .technicianId(technicianId)
                .status(IN_PROGRESS)
                .testType(dto.testType() != null ? dto.testType() : TestType.CONSTANT_HEAD)
                .specimenDiameterMm(dto.specimenDiameterMm())
                .specimenLengthMm(dto.specimenLengthMm())
                .waterTemperatureC(dto.waterTemperatureC() != null ? dto.waterTemperatureC() : DEFAULT_WATER_TEMP)
                .standpipeAreaCm2(dto.standpipeAreaCm2())
                .headCm(dto.headCm())
                .notes(dto.notes())
                .aiFlag(AiFlag.NONE)
                .build();
    }

    private void populateReadings(PermTest test, PermTestCreateDto dto) {
        for (int i = 0; i < dto.readings().size(); i++) {
            var readingDto = dto.readings().get(i);
            PermReading reading = PermReading.builder()
                    .permTest(test)
                    .readingNumber(i + 1)
                    .flowVolumeMl(readingDto.flowVolumeMl())
                    .initialHeadCm(readingDto.initialHeadCm())
                    .finalHeadCm(readingDto.finalHeadCm())
                    .elapsedTimeS(readingDto.elapsedTimeS())
                    .build();
            test.getReadings().add(reading);
        }
    }

    private PermTest findOrThrow(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Permeability test not found: " + id));
    }
}
