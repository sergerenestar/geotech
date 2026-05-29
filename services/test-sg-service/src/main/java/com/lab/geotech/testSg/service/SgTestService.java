package com.lab.geotech.testSg.service;

import com.lab.geotech.testSg.constant.AiFlag;
import com.lab.geotech.testSg.constant.TestStatus;
import com.lab.geotech.testSg.dto.SgTestCreateDto;
import com.lab.geotech.testSg.dto.SgTestResponse;
import com.lab.geotech.testSg.entity.SgDetermination;
import com.lab.geotech.testSg.entity.SgTest;
import com.lab.geotech.testSg.exception.InvalidStatusTransitionException;
import com.lab.geotech.testSg.exception.ResourceNotFoundException;
import com.lab.geotech.testSg.repository.SgTestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static com.lab.geotech.testSg.constant.TestStatus.*;

@Service
@RequiredArgsConstructor
public class SgTestService {

    private final SgTestRepository repository;
    private final SgCalculationService calculationService;
    private final SgAnomalyService anomalyService;

    private static final Map<TestStatus, Set<TestStatus>> TRANSITIONS = new EnumMap<>(TestStatus.class);

    static {
        TRANSITIONS.put(DRAFT,          EnumSet.of(IN_PROGRESS, PENDING_REVIEW));
        TRANSITIONS.put(IN_PROGRESS,    EnumSet.of(PENDING_REVIEW));
        TRANSITIONS.put(PENDING_REVIEW, EnumSet.of(APPROVED, REJECTED, IN_PROGRESS));
        TRANSITIONS.put(APPROVED,       EnumSet.noneOf(TestStatus.class));
        TRANSITIONS.put(REJECTED,       EnumSet.of(IN_PROGRESS));
    }

    @Transactional
    public SgTestResponse create(SgTestCreateDto dto, UUID technicianId) {
        SgTest test = SgTest.builder()
                .sampleId(dto.sampleId())
                .projectId(dto.projectId())
                .boreholeId(dto.boreholeId())
                .technicianId(technicianId)
                .status(IN_PROGRESS)
                .notes(dto.notes())
                .aiFlag(AiFlag.NONE)
                .build();

        populateDeterminations(test, dto);

        return SgTestResponse.from(repository.save(test));
    }

    @Transactional(readOnly = true)
    public SgTestResponse getById(UUID id) {
        return SgTestResponse.from(findOrThrow(id));
    }

    @Transactional(readOnly = true)
    public List<SgTestResponse> getBySampleId(UUID sampleId) {
        return repository.findAllBySampleId(sampleId).stream()
                .map(SgTestResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public Page<SgTestResponse> getByProjectId(UUID projectId, Pageable pageable) {
        return repository.findAllByProjectId(projectId, pageable).map(SgTestResponse::from);
    }

    @Transactional
    public SgTestResponse updateStatus(UUID id, TestStatus newStatus) {
        SgTest test = findOrThrow(id);
        Set<TestStatus> allowed = TRANSITIONS.getOrDefault(test.getStatus(), EnumSet.noneOf(TestStatus.class));
        if (!allowed.contains(newStatus)) {
            throw new InvalidStatusTransitionException(
                    "Cannot transition from " + test.getStatus() + " to " + newStatus);
        }
        test.setStatus(newStatus);
        return SgTestResponse.from(repository.save(test));
    }

    @Transactional(readOnly = true)
    public Optional<SgTestResponse> getLatestBySampleId(UUID sampleId) {
        return repository.findFirstBySampleIdOrderByCreatedAtDesc(sampleId)
                .map(SgTestResponse::from);
    }

    @Transactional
    public void softDelete(UUID id) {
        SgTest test = findOrThrow(id);
        test.setDeleted(true);
        repository.save(test);
    }

    @Transactional
    public SgTestResponse update(UUID id, SgTestCreateDto dto) {
        SgTest test = findOrThrow(id);

        test.setNotes(dto.notes());
        test.getDeterminations().clear();

        populateDeterminations(test, dto);

        return SgTestResponse.from(repository.save(test));
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private void populateDeterminations(SgTest test, SgTestCreateDto dto) {
        for (int i = 0; i < dto.determinations().size(); i++) {
            SgDetermination det = calculationService.calculateDetermination(
                    dto.determinations().get(i), i + 1);
            det.setSgTest(test);
            test.getDeterminations().add(det);
        }

        BigDecimal gsAverage = computeAverage(test.getDeterminations());
        test.setGsAverage(gsAverage);

        SgAnomalyService.AnomalyResult anomaly = anomalyService.analyze(gsAverage, test.getDeterminations());
        test.setAiFlag(anomaly.flag());
        test.setAiFlagMessage(anomaly.message());
    }

    private BigDecimal computeAverage(List<SgDetermination> determinations) {
        if (determinations == null || determinations.isEmpty()) return null;
        BigDecimal sum = determinations.stream()
                .map(SgDetermination::getGs20)
                .filter(v -> v != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        long count = determinations.stream()
                .map(SgDetermination::getGs20)
                .filter(v -> v != null)
                .count();
        if (count == 0) return null;
        return sum.divide(BigDecimal.valueOf(count), 4, RoundingMode.HALF_UP);
    }

    private SgTest findOrThrow(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SG test not found: " + id));
    }
}
