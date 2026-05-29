package com.lab.geotech.testWc.service;

import com.lab.geotech.testWc.constant.AiFlag;
import com.lab.geotech.testWc.constant.TestStatus;
import com.lab.geotech.testWc.dto.WcTestCreateDto;
import com.lab.geotech.testWc.dto.WcTestResponse;
import com.lab.geotech.testWc.entity.WcDetermination;
import com.lab.geotech.testWc.entity.WcTest;
import com.lab.geotech.testWc.exception.InvalidStatusTransitionException;
import com.lab.geotech.testWc.exception.ResourceNotFoundException;
import com.lab.geotech.testWc.repository.WcTestRepository;
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

import static com.lab.geotech.testWc.constant.TestStatus.*;

@Service
@RequiredArgsConstructor
public class WcTestService {

    private final WcTestRepository repository;
    private final WcCalculationService calculationService;
    private final WcAnomalyService anomalyService;

    private static final Map<TestStatus, Set<TestStatus>> TRANSITIONS = new EnumMap<>(TestStatus.class);

    static {
        TRANSITIONS.put(DRAFT, EnumSet.of(IN_PROGRESS, PENDING_REVIEW));
        TRANSITIONS.put(IN_PROGRESS, EnumSet.of(PENDING_REVIEW));
        TRANSITIONS.put(PENDING_REVIEW, EnumSet.of(APPROVED, REJECTED, IN_PROGRESS));
        TRANSITIONS.put(APPROVED, EnumSet.noneOf(TestStatus.class));
        TRANSITIONS.put(REJECTED, EnumSet.of(IN_PROGRESS));
    }

    @Transactional
    public WcTestResponse create(WcTestCreateDto dto, UUID technicianId) {
        WcTest test = WcTest.builder()
                .sampleId(dto.sampleId())
                .projectId(dto.projectId())
                .boreholeId(dto.boreholeId())
                .technicianId(technicianId)
                .status(IN_PROGRESS)
                .temperatureC(dto.temperatureC())
                .notes(dto.notes())
                .aiFlag(AiFlag.NONE)
                .build();

        for (int i = 0; i < dto.determinations().size(); i++) {
            WcDetermination det = calculationService.calculate(dto.determinations().get(i), i + 1);
            det.setWcTest(test);
            test.getDeterminations().add(det);
        }

        BigDecimal avg = calculationService.averageWaterContent(test.getDeterminations());
        test.setAverageWaterContentPct(avg);

        WcAnomalyService.AnomalyResult anomaly = anomalyService.analyze(test.getDeterminations(), avg);
        test.setAiFlag(anomaly.flag());
        test.setAiFlagMessage(anomaly.message());

        return WcTestResponse.from(repository.save(test));
    }

    @Transactional(readOnly = true)
    public WcTestResponse getById(UUID id) {
        return WcTestResponse.from(findOrThrow(id));
    }

    @Transactional(readOnly = true)
    public List<WcTestResponse> getBySampleId(UUID sampleId) {
        return repository.findAllBySampleId(sampleId).stream()
                .map(WcTestResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public Page<WcTestResponse> getByProjectId(UUID projectId, Pageable pageable) {
        return repository.findAllByProjectId(projectId, pageable).map(WcTestResponse::from);
    }

    @Transactional(readOnly = true)
    public Page<WcTestResponse> getByTechnicianId(UUID technicianId, Pageable pageable) {
        return repository.findAllByTechnicianId(technicianId, pageable).map(WcTestResponse::from);
    }

    @Transactional
    public WcTestResponse updateStatus(UUID id, TestStatus newStatus, UUID requestingUserId) {
        WcTest test = findOrThrow(id);
        Set<TestStatus> allowed = TRANSITIONS.getOrDefault(test.getStatus(), EnumSet.noneOf(TestStatus.class));
        if (!allowed.contains(newStatus)) {
            throw new InvalidStatusTransitionException(
                    "Cannot transition from " + test.getStatus() + " to " + newStatus);
        }
        test.setStatus(newStatus);
        return WcTestResponse.from(repository.save(test));
    }

    @Transactional(readOnly = true)
    public Optional<WcTestResponse> getLatestBySampleId(UUID sampleId) {
        return repository.findFirstBySampleIdOrderByCreatedAtDesc(sampleId)
                .map(WcTestResponse::from);
    }

    @Transactional
    public void softDelete(UUID id) {
        WcTest test = findOrThrow(id);
        test.setDeleted(true);
        repository.save(test);
    }

    @Transactional
    public WcTestResponse update(UUID id, WcTestCreateDto dto) {
        WcTest test = findOrThrow(id);
        test.getDeterminations().clear();
        for (int i = 0; i < dto.determinations().size(); i++) {
            WcDetermination det = calculationService.calculate(dto.determinations().get(i), i + 1);
            det.setWcTest(test);
            test.getDeterminations().add(det);
        }
        test.setTemperatureC(dto.temperatureC());
        test.setNotes(dto.notes());
        BigDecimal avg = calculationService.averageWaterContent(test.getDeterminations());
        test.setAverageWaterContentPct(avg);
        WcAnomalyService.AnomalyResult anomaly = anomalyService.analyze(test.getDeterminations(), avg);
        test.setAiFlag(anomaly.flag());
        test.setAiFlagMessage(anomaly.message());
        return WcTestResponse.from(repository.save(test));
    }

    private WcTest findOrThrow(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Water content test not found: " + id));
    }
}
