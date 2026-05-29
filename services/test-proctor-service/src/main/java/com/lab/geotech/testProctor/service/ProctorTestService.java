package com.lab.geotech.testProctor.service;

import com.lab.geotech.testProctor.constant.AiFlag;
import com.lab.geotech.testProctor.constant.ProctorMethod;
import com.lab.geotech.testProctor.constant.TestStatus;
import com.lab.geotech.testProctor.dto.ProctorTestCreateDto;
import com.lab.geotech.testProctor.dto.ProctorTestResponse;
import com.lab.geotech.testProctor.entity.ProctorPoint;
import com.lab.geotech.testProctor.entity.ProctorTest;
import com.lab.geotech.testProctor.exception.InvalidStatusTransitionException;
import com.lab.geotech.testProctor.exception.ResourceNotFoundException;
import com.lab.geotech.testProctor.repository.ProctorTestRepository;
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

import static com.lab.geotech.testProctor.constant.TestStatus.*;

@Service
@RequiredArgsConstructor
public class ProctorTestService {

    private final ProctorTestRepository repository;
    private final ProctorCalculationService calculationService;
    private final ProctorAnomalyService anomalyService;

    private static final Map<TestStatus, Set<TestStatus>> TRANSITIONS = new EnumMap<>(TestStatus.class);

    static {
        TRANSITIONS.put(DRAFT,          EnumSet.of(IN_PROGRESS, PENDING_REVIEW));
        TRANSITIONS.put(IN_PROGRESS,    EnumSet.of(PENDING_REVIEW));
        TRANSITIONS.put(PENDING_REVIEW, EnumSet.of(APPROVED, REJECTED, IN_PROGRESS));
        TRANSITIONS.put(APPROVED,       EnumSet.noneOf(TestStatus.class));
        TRANSITIONS.put(REJECTED,       EnumSet.of(IN_PROGRESS));
    }

    // -----------------------------------------------------------------------
    // Create
    // -----------------------------------------------------------------------

    @Transactional
    public ProctorTestResponse create(ProctorTestCreateDto dto, UUID technicianId) {
        ProctorMethod method = parseMethod(dto.method());
        BigDecimal specificGravity = dto.specificGravity() != null
                ? dto.specificGravity()
                : new BigDecimal("2.70");

        ProctorTest test = ProctorTest.builder()
                .sampleId(dto.sampleId())
                .projectId(dto.projectId())
                .boreholeId(dto.boreholeId())
                .technicianId(technicianId)
                .status(IN_PROGRESS)
                .method(method)
                .moldVolumeCm3(dto.moldVolumeCm3())
                .moldMassG(dto.moldMassG())
                .specificGravity(specificGravity)
                .notes(dto.notes())
                .aiFlag(AiFlag.NONE)
                .build();

        populatePoints(test, dto);
        applyCalculations(test);

        return ProctorTestResponse.from(repository.save(test));
    }

    // -----------------------------------------------------------------------
    // Read
    // -----------------------------------------------------------------------

    @Transactional(readOnly = true)
    public ProctorTestResponse getById(UUID id) {
        return ProctorTestResponse.from(findOrThrow(id));
    }

    @Transactional(readOnly = true)
    public List<ProctorTestResponse> getBySampleId(UUID sampleId) {
        return repository.findAllBySampleId(sampleId).stream()
                .map(ProctorTestResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<ProctorTestResponse> getByProjectId(UUID projectId, Pageable pageable) {
        return repository.findAllByProjectId(projectId, pageable)
                .map(ProctorTestResponse::from);
    }

    @Transactional(readOnly = true)
    public Optional<ProctorTestResponse> getLatestBySampleId(UUID sampleId) {
        return repository.findFirstBySampleIdOrderByCreatedAtDesc(sampleId)
                .map(ProctorTestResponse::from);
    }

    // -----------------------------------------------------------------------
    // Update status
    // -----------------------------------------------------------------------

    @Transactional
    public ProctorTestResponse updateStatus(UUID id, TestStatus newStatus) {
        ProctorTest test = findOrThrow(id);
        Set<TestStatus> allowed = TRANSITIONS.getOrDefault(test.getStatus(), EnumSet.noneOf(TestStatus.class));
        if (!allowed.contains(newStatus)) {
            throw new InvalidStatusTransitionException(
                    "Cannot transition from " + test.getStatus() + " to " + newStatus);
        }
        test.setStatus(newStatus);
        return ProctorTestResponse.from(repository.save(test));
    }

    // -----------------------------------------------------------------------
    // Soft delete
    // -----------------------------------------------------------------------

    @Transactional
    public void softDelete(UUID id) {
        ProctorTest test = findOrThrow(id);
        test.setDeleted(true);
        repository.save(test);
    }

    // -----------------------------------------------------------------------
    // Full update (replace points and recalculate)
    // -----------------------------------------------------------------------

    @Transactional
    public ProctorTestResponse update(UUID id, ProctorTestCreateDto dto) {
        ProctorTest test = findOrThrow(id);
        ProctorMethod method = parseMethod(dto.method());
        BigDecimal specificGravity = dto.specificGravity() != null
                ? dto.specificGravity()
                : new BigDecimal("2.70");

        test.setMethod(method);
        test.setMoldVolumeCm3(dto.moldVolumeCm3());
        test.setMoldMassG(dto.moldMassG());
        test.setSpecificGravity(specificGravity);
        test.setNotes(dto.notes());
        test.setSampleId(dto.sampleId());
        test.setProjectId(dto.projectId());
        test.setBoreholeId(dto.boreholeId());

        test.getPoints().clear();
        populatePoints(test, dto);
        applyCalculations(test);

        return ProctorTestResponse.from(repository.save(test));
    }

    // -----------------------------------------------------------------------
    // Internal helpers
    // -----------------------------------------------------------------------

    private void populatePoints(ProctorTest test, ProctorTestCreateDto dto) {
        for (int i = 0; i < dto.points().size(); i++) {
            ProctorPoint point = calculationService.calculatePoint(
                    dto.points().get(i), i + 1,
                    test.getMoldMassG(), test.getMoldVolumeCm3());
            point.setProctorTest(test);
            test.getPoints().add(point);
        }
    }

    private void applyCalculations(ProctorTest test) {
        List<ProctorPoint> points = test.getPoints();

        // Polynomial fit (requires >= 3 points)
        double[] fit = calculationService.fitPolynomial(points);
        BigDecimal omc    = calculationService.toBigDecimal3(fit[0]);
        BigDecimal gdMax  = calculationService.toBigDecimal3(fit[1]);
        BigDecimal rSq    = calculationService.toBigDecimalR2(fit[2]);

        test.setOmcPct(omc);
        test.setGdMaxKnM3(gdMax);
        test.setRSquared(rSq);

        // Anomaly analysis
        ProctorAnomalyService.AnomalyResult anomaly =
                anomalyService.analyze(gdMax, omc, rSq, points);
        test.setAiFlag(anomaly.flag());
        test.setAiFlagMessage(anomaly.message());
    }

    private ProctorTest findOrThrow(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Proctor test not found: " + id));
    }

    private ProctorMethod parseMethod(String method) {
        if (method == null || method.isBlank()) return ProctorMethod.STANDARD;
        try {
            return ProctorMethod.valueOf(method.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ProctorMethod.STANDARD;
        }
    }
}
