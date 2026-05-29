package com.lab.geotech.testConsol.service;

import com.lab.geotech.testConsol.constant.AiFlag;
import com.lab.geotech.testConsol.constant.DrainageType;
import com.lab.geotech.testConsol.constant.LoadType;
import com.lab.geotech.testConsol.constant.TestStatus;
import com.lab.geotech.testConsol.dto.ConsolTestCreateDto;
import com.lab.geotech.testConsol.dto.ConsolTestResponse;
import com.lab.geotech.testConsol.entity.ConsolReading;
import com.lab.geotech.testConsol.entity.ConsolStage;
import com.lab.geotech.testConsol.entity.ConsolTest;
import com.lab.geotech.testConsol.exception.InvalidStatusTransitionException;
import com.lab.geotech.testConsol.exception.ResourceNotFoundException;
import com.lab.geotech.testConsol.repository.ConsolTestRepository;
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

import static com.lab.geotech.testConsol.constant.TestStatus.*;

@Service
@RequiredArgsConstructor
public class ConsolTestService {

    private final ConsolTestRepository repository;
    private final ConsolCalculationService calculationService;
    private final ConsolAnomalyService anomalyService;

    private static final BigDecimal DEFAULT_SPECIFIC_GRAVITY = new BigDecimal("2.7");

    private static final Map<TestStatus, Set<TestStatus>> TRANSITIONS = new EnumMap<>(TestStatus.class);

    static {
        TRANSITIONS.put(DRAFT, EnumSet.of(IN_PROGRESS, PENDING_REVIEW));
        TRANSITIONS.put(IN_PROGRESS, EnumSet.of(PENDING_REVIEW));
        TRANSITIONS.put(PENDING_REVIEW, EnumSet.of(APPROVED, REJECTED, IN_PROGRESS));
        TRANSITIONS.put(APPROVED, EnumSet.noneOf(TestStatus.class));
        TRANSITIONS.put(REJECTED, EnumSet.of(IN_PROGRESS));
    }

    @Transactional
    public ConsolTestResponse create(ConsolTestCreateDto dto, UUID technicianId) {
        ConsolTest test = buildTest(dto, technicianId);
        populateStages(test, dto);
        calculationService.calculate(test, dto.stages());
        anomalyService.analyze(test);
        return ConsolTestResponse.from(repository.save(test));
    }

    @Transactional(readOnly = true)
    public ConsolTestResponse getById(UUID id) {
        return ConsolTestResponse.from(findOrThrow(id));
    }

    @Transactional(readOnly = true)
    public List<ConsolTestResponse> getBySampleId(UUID sampleId) {
        return repository.findAllBySampleId(sampleId).stream()
                .map(ConsolTestResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public Page<ConsolTestResponse> getByProjectId(UUID projectId, Pageable pageable) {
        return repository.findAllByProjectId(projectId, pageable).map(ConsolTestResponse::from);
    }

    @Transactional
    public ConsolTestResponse updateStatus(UUID id, TestStatus newStatus) {
        ConsolTest test = findOrThrow(id);
        Set<TestStatus> allowed = TRANSITIONS.getOrDefault(test.getStatus(), EnumSet.noneOf(TestStatus.class));
        if (!allowed.contains(newStatus)) {
            throw new InvalidStatusTransitionException(
                    "Cannot transition from " + test.getStatus() + " to " + newStatus);
        }
        test.setStatus(newStatus);
        return ConsolTestResponse.from(repository.save(test));
    }

    @Transactional(readOnly = true)
    public Optional<ConsolTestResponse> getLatestBySampleId(UUID sampleId) {
        return repository.findFirstBySampleIdOrderByCreatedAtDesc(sampleId)
                .map(ConsolTestResponse::from);
    }

    @Transactional
    public void softDelete(UUID id) {
        ConsolTest test = findOrThrow(id);
        test.setDeleted(true);
        repository.save(test);
    }

    @Transactional
    public ConsolTestResponse update(UUID id, ConsolTestCreateDto dto) {
        ConsolTest test = findOrThrow(id);
        test.setSpecimenDiameterMm(dto.specimenDiameterMm());
        test.setInitialHeightMm(dto.initialHeightMm());
        test.setInitialVoidRatio(dto.initialVoidRatio());
        test.setSpecificGravity(dto.specificGravity() != null ? dto.specificGravity() : DEFAULT_SPECIFIC_GRAVITY);
        test.setDrainageType(dto.drainageType() != null ? dto.drainageType() : DrainageType.DOUBLE);
        test.setNotes(dto.notes());
        test.getStages().clear();
        populateStages(test, dto);
        calculationService.calculate(test, dto.stages());
        anomalyService.analyze(test);
        return ConsolTestResponse.from(repository.save(test));
    }

    private ConsolTest buildTest(ConsolTestCreateDto dto, UUID technicianId) {
        return ConsolTest.builder()
                .sampleId(dto.sampleId())
                .projectId(dto.projectId())
                .boreholeId(dto.boreholeId())
                .technicianId(technicianId)
                .status(IN_PROGRESS)
                .specimenDiameterMm(dto.specimenDiameterMm())
                .initialHeightMm(dto.initialHeightMm())
                .initialVoidRatio(dto.initialVoidRatio())
                .specificGravity(dto.specificGravity() != null ? dto.specificGravity() : DEFAULT_SPECIFIC_GRAVITY)
                .drainageType(dto.drainageType() != null ? dto.drainageType() : DrainageType.DOUBLE)
                .notes(dto.notes())
                .aiFlag(AiFlag.NONE)
                .build();
    }

    private void populateStages(ConsolTest test, ConsolTestCreateDto dto) {
        for (int i = 0; i < dto.stages().size(); i++) {
            var stageDto = dto.stages().get(i);
            ConsolStage stage = ConsolStage.builder()
                    .consolTest(test)
                    .stageNumber(i + 1)
                    .loadType(stageDto.loadType() != null ? stageDto.loadType() : LoadType.LOADING)
                    .sigmaVKpa(stageDto.sigmaVKpa())
                    .build();
            for (int j = 0; j < stageDto.readings().size(); j++) {
                var readingDto = stageDto.readings().get(j);
                ConsolReading reading = ConsolReading.builder()
                        .consolStage(stage)
                        .readingNumber(readingDto.readingNumber() > 0 ? readingDto.readingNumber() : j + 1)
                        .timeMin(readingDto.timeMin())
                        .dialReadingMm(readingDto.dialReadingMm())
                        .build();
                stage.getReadings().add(reading);
            }
            test.getStages().add(stage);
        }
    }

    private ConsolTest findOrThrow(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Consolidation test not found: " + id));
    }
}
