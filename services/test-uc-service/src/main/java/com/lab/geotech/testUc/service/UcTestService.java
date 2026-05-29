package com.lab.geotech.testUc.service;

import com.lab.geotech.testUc.constant.AiFlag;
import com.lab.geotech.testUc.constant.TestStatus;
import com.lab.geotech.testUc.dto.UcTestCreateDto;
import com.lab.geotech.testUc.dto.UcTestResponse;
import com.lab.geotech.testUc.entity.UcReading;
import com.lab.geotech.testUc.entity.UcTest;
import com.lab.geotech.testUc.exception.InvalidStatusTransitionException;
import com.lab.geotech.testUc.exception.ResourceNotFoundException;
import com.lab.geotech.testUc.repository.UcTestRepository;
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

import static com.lab.geotech.testUc.constant.TestStatus.*;

@Service
@RequiredArgsConstructor
public class UcTestService {

    private final UcTestRepository repository;
    private final UcCalculationService calculationService;
    private final UcAnomalyService anomalyService;

    private static final BigDecimal DEFAULT_DIAL_FACTOR = new BigDecimal("0.01");
    private static final int SCALE_STRESS = 3;
    private static final RoundingMode ROUNDING = RoundingMode.HALF_UP;

    private static final Map<TestStatus, Set<TestStatus>> TRANSITIONS = new EnumMap<>(TestStatus.class);

    static {
        TRANSITIONS.put(DRAFT, EnumSet.of(IN_PROGRESS, PENDING_REVIEW));
        TRANSITIONS.put(IN_PROGRESS, EnumSet.of(PENDING_REVIEW));
        TRANSITIONS.put(PENDING_REVIEW, EnumSet.of(APPROVED, REJECTED, IN_PROGRESS));
        TRANSITIONS.put(APPROVED, EnumSet.noneOf(TestStatus.class));
        TRANSITIONS.put(REJECTED, EnumSet.of(IN_PROGRESS));
    }

    @Transactional
    public UcTestResponse create(UcTestCreateDto dto, UUID technicianId) {
        BigDecimal dialFactor = dto.dialGaugeFactorMmPerDiv() != null
                ? dto.dialGaugeFactorMmPerDiv()
                : DEFAULT_DIAL_FACTOR;

        BigDecimal a0Cm2 = calculationService.computeA0Cm2(dto.initialDiameterMm());

        UcTest test = UcTest.builder()
                .sampleId(dto.sampleId())
                .projectId(dto.projectId())
                .boreholeId(dto.boreholeId())
                .technicianId(technicianId)
                .status(IN_PROGRESS)
                .initialHeightMm(dto.initialHeightMm())
                .initialDiameterMm(dto.initialDiameterMm())
                .dialGaugeFactorMmPerDiv(dialFactor)
                .calibrationFactorNPerDiv(dto.calibrationFactorNPerDiv())
                .failureMode(dto.failureMode())
                .notes(dto.notes())
                .aiFlag(AiFlag.NONE)
                .build();

        populateReadings(test, dto, a0Cm2, dialFactor);
        computePeakAndAnomaly(test);

        return UcTestResponse.from(repository.save(test));
    }

    @Transactional(readOnly = true)
    public UcTestResponse getById(UUID id) {
        return UcTestResponse.from(findOrThrow(id));
    }

    @Transactional(readOnly = true)
    public List<UcTestResponse> getBySampleId(UUID sampleId) {
        return repository.findAllBySampleId(sampleId).stream()
                .map(UcTestResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<UcTestResponse> getByProjectId(UUID projectId, Pageable pageable) {
        return repository.findAllByProjectId(projectId, pageable)
                .map(UcTestResponse::from);
    }

    @Transactional
    public UcTestResponse updateStatus(UUID id, TestStatus newStatus) {
        UcTest test = findOrThrow(id);
        Set<TestStatus> allowed = TRANSITIONS.getOrDefault(test.getStatus(), EnumSet.noneOf(TestStatus.class));
        if (!allowed.contains(newStatus)) {
            throw new InvalidStatusTransitionException(
                    "Cannot transition from " + test.getStatus() + " to " + newStatus);
        }
        test.setStatus(newStatus);
        return UcTestResponse.from(repository.save(test));
    }

    @Transactional(readOnly = true)
    public Optional<UcTestResponse> getLatestBySampleId(UUID sampleId) {
        return repository.findFirstBySampleIdOrderByCreatedAtDesc(sampleId)
                .map(UcTestResponse::from);
    }

    @Transactional
    public void softDelete(UUID id) {
        UcTest test = findOrThrow(id);
        test.setDeleted(true);
        repository.save(test);
    }

    @Transactional
    public UcTestResponse update(UUID id, UcTestCreateDto dto) {
        UcTest test = findOrThrow(id);

        BigDecimal dialFactor = dto.dialGaugeFactorMmPerDiv() != null
                ? dto.dialGaugeFactorMmPerDiv()
                : DEFAULT_DIAL_FACTOR;

        BigDecimal a0Cm2 = calculationService.computeA0Cm2(dto.initialDiameterMm());

        test.setInitialHeightMm(dto.initialHeightMm());
        test.setInitialDiameterMm(dto.initialDiameterMm());
        test.setDialGaugeFactorMmPerDiv(dialFactor);
        test.setCalibrationFactorNPerDiv(dto.calibrationFactorNPerDiv());
        test.setFailureMode(dto.failureMode());
        test.setNotes(dto.notes());

        test.getReadings().clear();
        populateReadings(test, dto, a0Cm2, dialFactor);
        computePeakAndAnomaly(test);

        return UcTestResponse.from(repository.save(test));
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private void populateReadings(UcTest test, UcTestCreateDto dto,
                                   BigDecimal a0Cm2, BigDecimal dialFactor) {
        for (int i = 0; i < dto.readings().size(); i++) {
            UcReading reading = calculationService.calculateReading(
                    dto.readings().get(i),
                    i + 1,
                    dto.initialHeightMm(),
                    a0Cm2,
                    dialFactor,
                    dto.calibrationFactorNPerDiv()
            );
            reading.setUcTest(test);
            test.getReadings().add(reading);
        }
    }

    /**
     * Detects peak qu/su/failureStrain from the readings already attached to the test,
     * then runs anomaly analysis and sets all fields on the test entity.
     */
    private void computePeakAndAnomaly(UcTest test) {
        List<UcReading> readings = test.getReadings();

        BigDecimal[] peak = calculationService.detectPeak(readings);
        BigDecimal quKpa = peak[0];
        BigDecimal failureStrainPct = peak[1];

        // Determine if qu was taken at 15% strain (no clear peak)
        boolean quTakenAt15 = isNoClePeak(readings) && maxStrain(readings).compareTo(BigDecimal.valueOf(15)) >= 0;

        BigDecimal suKpa = quKpa.divide(BigDecimal.valueOf(2), SCALE_STRESS, ROUNDING);

        test.setQuKpa(quKpa);
        test.setSuKpa(suKpa);
        test.setFailureStrainPct(failureStrainPct.setScale(SCALE_STRESS, ROUNDING));

        UcAnomalyService.AnomalyResult anomaly =
                anomalyService.analyze(quKpa, failureStrainPct, readings, quTakenAt15);
        test.setAiFlag(anomaly.flag());
        test.setAiFlagMessage(anomaly.message());
    }

    /**
     * Returns true when all readings show monotonically non-decreasing stress
     * (i.e. no clear peak — last reading has the maximum stress).
     */
    private boolean isNoClePeak(List<UcReading> readings) {
        if (readings == null || readings.size() < 2) return false;
        for (int i = 1; i < readings.size(); i++) {
            BigDecimal prev = readings.get(i - 1).getStressKpa();
            BigDecimal curr = readings.get(i).getStressKpa();
            if (prev != null && curr != null && curr.compareTo(prev) < 0) {
                return false; // found a decrease → there is a peak
            }
        }
        return true;
    }

    private BigDecimal maxStrain(List<UcReading> readings) {
        return readings.stream()
                .map(UcReading::getStrainPct)
                .filter(s -> s != null)
                .max(BigDecimal::compareTo)
                .orElse(BigDecimal.ZERO);
    }

    private UcTest findOrThrow(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("UC test not found: " + id));
    }
}
