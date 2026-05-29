package com.lab.geotech.testLl.service;

import com.lab.geotech.testLl.constant.AiFlag;
import com.lab.geotech.testLl.constant.TestMethod;
import com.lab.geotech.testLl.constant.TestStatus;
import com.lab.geotech.testLl.dto.LlTestCreateDto;
import com.lab.geotech.testLl.dto.LlTestResponse;
import com.lab.geotech.testLl.entity.LlCasagrandePoint;
import com.lab.geotech.testLl.entity.LlPlDetermination;
import com.lab.geotech.testLl.entity.LlTest;
import com.lab.geotech.testLl.exception.InvalidStatusTransitionException;
import com.lab.geotech.testLl.exception.ResourceNotFoundException;
import com.lab.geotech.testLl.repository.LlTestRepository;
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

import static com.lab.geotech.testLl.constant.TestStatus.*;

@Service
@RequiredArgsConstructor
public class LlTestService {

    private final LlTestRepository repository;
    private final LlCalculationService calculationService;
    private final LlAnomalyService anomalyService;

    private static final Map<TestStatus, Set<TestStatus>> TRANSITIONS = new EnumMap<>(TestStatus.class);

    static {
        TRANSITIONS.put(DRAFT, EnumSet.of(IN_PROGRESS, PENDING_REVIEW));
        TRANSITIONS.put(IN_PROGRESS, EnumSet.of(PENDING_REVIEW));
        TRANSITIONS.put(PENDING_REVIEW, EnumSet.of(APPROVED, REJECTED, IN_PROGRESS));
        TRANSITIONS.put(APPROVED, EnumSet.noneOf(TestStatus.class));
        TRANSITIONS.put(REJECTED, EnumSet.of(IN_PROGRESS));
    }

    @Transactional
    public LlTestResponse create(LlTestCreateDto dto, UUID technicianId) {
        TestMethod method = parseMethod(dto.method());

        LlTest test = LlTest.builder()
                .sampleId(dto.sampleId())
                .projectId(dto.projectId())
                .boreholeId(dto.boreholeId())
                .technicianId(technicianId)
                .status(IN_PROGRESS)
                .method(method)
                .notes(dto.notes())
                .aiFlag(AiFlag.NONE)
                .build();

        // Calculate Casagrande points with water content
        for (int i = 0; i < dto.casagrandePoints().size(); i++) {
            LlCasagrandePoint point = calculationService.calculateCasagrandePoint(
                    dto.casagrandePoints().get(i), i + 1);
            point.setLlTest(test);
            test.getCasagrandePoints().add(point);
        }

        // Calculate PL determinations with water content
        if (dto.plDeterminations() != null) {
            for (int i = 0; i < dto.plDeterminations().size(); i++) {
                LlPlDetermination det = calculationService.calculatePlDetermination(
                        dto.plDeterminations().get(i), i + 1);
                det.setLlTest(test);
                test.getPlDeterminations().add(det);
            }
        }

        // Compute LL
        BigDecimal ll = calculationService.calculateLiquidLimit(test.getCasagrandePoints(), method);
        test.setLlPct(ll);

        // Compute R² (only meaningful for multi-point)
        BigDecimal r2 = null;
        if (method == TestMethod.MULTI_POINT) {
            r2 = calculationService.calculateRSquared(test.getCasagrandePoints());
            test.setRSquared(r2);
        }

        // Compute PL
        BigDecimal pl = calculationService.calculatePlasticLimit(test.getPlDeterminations());
        test.setPlPct(pl);

        // Compute PI
        BigDecimal pi = null;
        if (ll != null && pl != null) {
            pi = ll.subtract(pl);
            test.setPiPct(pi);
        }

        // USCS classification
        if (ll != null && pi != null) {
            UscsClassifier.UscsResult uscs = UscsClassifier.classify(ll, pi);
            test.setUscsSymbol(uscs.symbol());
            test.setUscsName(uscs.name());
        }

        // Anomaly analysis
        LlAnomalyService.AnomalyResult anomaly = anomalyService.analyze(
                ll, pl, pi, r2, test.getCasagrandePoints());
        test.setAiFlag(anomaly.flag());
        test.setAiFlagMessage(anomaly.message());

        return LlTestResponse.from(repository.save(test));
    }

    @Transactional(readOnly = true)
    public LlTestResponse getById(UUID id) {
        return LlTestResponse.from(findOrThrow(id));
    }

    @Transactional(readOnly = true)
    public List<LlTestResponse> getBySampleId(UUID sampleId) {
        return repository.findAllBySampleId(sampleId).stream()
                .map(LlTestResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public Page<LlTestResponse> getByProjectId(UUID projectId, Pageable pageable) {
        return repository.findAllByProjectId(projectId, pageable).map(LlTestResponse::from);
    }

    @Transactional
    public LlTestResponse updateStatus(UUID id, TestStatus newStatus) {
        LlTest test = findOrThrow(id);
        Set<TestStatus> allowed = TRANSITIONS.getOrDefault(test.getStatus(), EnumSet.noneOf(TestStatus.class));
        if (!allowed.contains(newStatus)) {
            throw new InvalidStatusTransitionException(
                    "Cannot transition from " + test.getStatus() + " to " + newStatus);
        }
        test.setStatus(newStatus);
        return LlTestResponse.from(repository.save(test));
    }

    @Transactional(readOnly = true)
    public Optional<LlTestResponse> getLatestBySampleId(UUID sampleId) {
        return repository.findFirstBySampleIdOrderByCreatedAtDesc(sampleId)
                .map(LlTestResponse::from);
    }

    @Transactional
    public void softDelete(UUID id) {
        LlTest test = findOrThrow(id);
        test.setDeleted(true);
        repository.save(test);
    }

    @Transactional
    public LlTestResponse update(UUID id, LlTestCreateDto dto) {
        LlTest test = findOrThrow(id);
        TestMethod method = parseMethod(dto.method());

        test.getCasagrandePoints().clear();
        for (int i = 0; i < dto.casagrandePoints().size(); i++) {
            LlCasagrandePoint point = calculationService.calculateCasagrandePoint(
                    dto.casagrandePoints().get(i), i + 1);
            point.setLlTest(test);
            test.getCasagrandePoints().add(point);
        }

        test.getPlDeterminations().clear();
        if (dto.plDeterminations() != null) {
            for (int i = 0; i < dto.plDeterminations().size(); i++) {
                LlPlDetermination det = calculationService.calculatePlDetermination(
                        dto.plDeterminations().get(i), i + 1);
                det.setLlTest(test);
                test.getPlDeterminations().add(det);
            }
        }

        test.setMethod(method);
        test.setNotes(dto.notes());

        BigDecimal ll = calculationService.calculateLiquidLimit(test.getCasagrandePoints(), method);
        test.setLlPct(ll);

        BigDecimal r2 = null;
        if (method == TestMethod.MULTI_POINT) {
            r2 = calculationService.calculateRSquared(test.getCasagrandePoints());
            test.setRSquared(r2);
        }

        BigDecimal pl = calculationService.calculatePlasticLimit(test.getPlDeterminations());
        test.setPlPct(pl);

        BigDecimal pi = null;
        if (ll != null && pl != null) {
            pi = ll.subtract(pl);
            test.setPiPct(pi);
        }

        if (ll != null && pi != null) {
            UscsClassifier.UscsResult uscs = UscsClassifier.classify(ll, pi);
            test.setUscsSymbol(uscs.symbol());
            test.setUscsName(uscs.name());
        }

        LlAnomalyService.AnomalyResult anomaly = anomalyService.analyze(
                ll, pl, pi, r2, test.getCasagrandePoints());
        test.setAiFlag(anomaly.flag());
        test.setAiFlagMessage(anomaly.message());

        return LlTestResponse.from(repository.save(test));
    }

    private LlTest findOrThrow(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("LL test not found: " + id));
    }

    private TestMethod parseMethod(String method) {
        if (method == null || method.isBlank()) return TestMethod.MULTI_POINT;
        try {
            return TestMethod.valueOf(method.toUpperCase());
        } catch (IllegalArgumentException e) {
            return TestMethod.MULTI_POINT;
        }
    }
}
