package com.lab.geotech.testDs.service;

import com.lab.geotech.testDs.constant.AiFlag;
import com.lab.geotech.testDs.constant.TestStatus;
import com.lab.geotech.testDs.dto.DsTestCreateDto;
import com.lab.geotech.testDs.dto.DsTestResponse;
import com.lab.geotech.testDs.entity.DsReading;
import com.lab.geotech.testDs.entity.DsStage;
import com.lab.geotech.testDs.entity.DsTest;
import com.lab.geotech.testDs.exception.InvalidStatusTransitionException;
import com.lab.geotech.testDs.exception.ResourceNotFoundException;
import com.lab.geotech.testDs.repository.DsTestRepository;
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

import static com.lab.geotech.testDs.constant.TestStatus.*;

@Service
@RequiredArgsConstructor
public class DsTestService {

    private final DsTestRepository repository;
    private final DsCalculationService calculationService;
    private final DsAnomalyService anomalyService;

    private static final BigDecimal DEFAULT_BOX_DIM = new BigDecimal("60.0");
    private static final BigDecimal DEFAULT_DIAL_FACTOR = new BigDecimal("0.01");

    private static final Map<TestStatus, Set<TestStatus>> TRANSITIONS = new EnumMap<>(TestStatus.class);

    static {
        TRANSITIONS.put(DRAFT, EnumSet.of(IN_PROGRESS, PENDING_REVIEW));
        TRANSITIONS.put(IN_PROGRESS, EnumSet.of(PENDING_REVIEW));
        TRANSITIONS.put(PENDING_REVIEW, EnumSet.of(APPROVED, REJECTED, IN_PROGRESS));
        TRANSITIONS.put(APPROVED, EnumSet.noneOf(TestStatus.class));
        TRANSITIONS.put(REJECTED, EnumSet.of(IN_PROGRESS));
    }

    @Transactional
    public DsTestResponse create(DsTestCreateDto dto, UUID technicianId) {
        DsTest test = buildTest(dto, technicianId);
        populateStages(test, dto);
        calculationService.calculate(test, dto.stages());
        anomalyService.analyze(test);
        return DsTestResponse.from(repository.save(test));
    }

    @Transactional(readOnly = true)
    public DsTestResponse getById(UUID id) {
        return DsTestResponse.from(findOrThrow(id));
    }

    @Transactional(readOnly = true)
    public List<DsTestResponse> getBySampleId(UUID sampleId) {
        return repository.findAllBySampleId(sampleId).stream()
                .map(DsTestResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public Page<DsTestResponse> getByProjectId(UUID projectId, Pageable pageable) {
        return repository.findAllByProjectId(projectId, pageable).map(DsTestResponse::from);
    }

    @Transactional
    public DsTestResponse updateStatus(UUID id, TestStatus newStatus) {
        DsTest test = findOrThrow(id);
        Set<TestStatus> allowed = TRANSITIONS.getOrDefault(test.getStatus(), EnumSet.noneOf(TestStatus.class));
        if (!allowed.contains(newStatus)) {
            throw new InvalidStatusTransitionException(
                    "Cannot transition from " + test.getStatus() + " to " + newStatus);
        }
        test.setStatus(newStatus);
        return DsTestResponse.from(repository.save(test));
    }

    @Transactional(readOnly = true)
    public Optional<DsTestResponse> getLatestBySampleId(UUID sampleId) {
        return repository.findFirstBySampleIdOrderByCreatedAtDesc(sampleId)
                .map(DsTestResponse::from);
    }

    @Transactional
    public void softDelete(UUID id) {
        DsTest test = findOrThrow(id);
        test.setDeleted(true);
        repository.save(test);
    }

    @Transactional
    public DsTestResponse update(UUID id, DsTestCreateDto dto) {
        DsTest test = findOrThrow(id);
        test.setBoxWidthMm(dto.boxWidthMm() != null ? dto.boxWidthMm() : DEFAULT_BOX_DIM);
        test.setBoxLengthMm(dto.boxLengthMm() != null ? dto.boxLengthMm() : DEFAULT_BOX_DIM);
        test.setSpecimenHeightMm(dto.specimenHeightMm());
        test.setDialFactorMmPerDiv(dto.dialFactorMmPerDiv() != null ? dto.dialFactorMmPerDiv() : DEFAULT_DIAL_FACTOR);
        test.setCalibrationFactorNPerDiv(dto.calibrationFactorNPerDiv());
        test.setNotes(dto.notes());
        test.getStages().clear();
        populateStages(test, dto);
        calculationService.calculate(test, dto.stages());
        anomalyService.analyze(test);
        return DsTestResponse.from(repository.save(test));
    }

    private DsTest buildTest(DsTestCreateDto dto, UUID technicianId) {
        return DsTest.builder()
                .sampleId(dto.sampleId())
                .projectId(dto.projectId())
                .boreholeId(dto.boreholeId())
                .technicianId(technicianId)
                .status(IN_PROGRESS)
                .boxWidthMm(dto.boxWidthMm() != null ? dto.boxWidthMm() : DEFAULT_BOX_DIM)
                .boxLengthMm(dto.boxLengthMm() != null ? dto.boxLengthMm() : DEFAULT_BOX_DIM)
                .specimenHeightMm(dto.specimenHeightMm())
                .dialFactorMmPerDiv(dto.dialFactorMmPerDiv() != null ? dto.dialFactorMmPerDiv() : DEFAULT_DIAL_FACTOR)
                .calibrationFactorNPerDiv(dto.calibrationFactorNPerDiv())
                .notes(dto.notes())
                .aiFlag(AiFlag.NONE)
                .build();
    }

    private void populateStages(DsTest test, DsTestCreateDto dto) {
        for (int i = 0; i < dto.stages().size(); i++) {
            var stageDto = dto.stages().get(i);
            DsStage stage = DsStage.builder()
                    .dsTest(test)
                    .stageNumber(i + 1)
                    .normalStressKpa(stageDto.normalStressKpa())
                    .build();
            for (int j = 0; j < stageDto.readings().size(); j++) {
                var readingDto = stageDto.readings().get(j);
                DsReading reading = DsReading.builder()
                        .dsStage(stage)
                        .readingNumber(j + 1)
                        .displacementDiv(readingDto.displacementDiv())
                        .provingRingDiv(readingDto.provingRingDiv())
                        .build();
                stage.getReadings().add(reading);
            }
            test.getStages().add(stage);
        }
    }

    private DsTest findOrThrow(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("DS test not found: " + id));
    }
}
