package com.lab.geotech.testPs.service;

import com.lab.geotech.testPs.constant.AiFlag;
import com.lab.geotech.testPs.constant.PsTestType;
import com.lab.geotech.testPs.constant.TestStatus;
import com.lab.geotech.testPs.dto.PsTestCreateDto;
import com.lab.geotech.testPs.dto.PsTestResponse;
import com.lab.geotech.testPs.entity.PsHydrometerReading;
import com.lab.geotech.testPs.entity.PsSieveResult;
import com.lab.geotech.testPs.entity.PsTest;
import com.lab.geotech.testPs.exception.InvalidStatusTransitionException;
import com.lab.geotech.testPs.exception.ResourceNotFoundException;
import com.lab.geotech.testPs.repository.PsTestRepository;
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

import static com.lab.geotech.testPs.constant.TestStatus.*;

@Service
@RequiredArgsConstructor
public class PsTestService {

    private final PsTestRepository repository;
    private final PsCalculationService calculationService;
    private final PsAnomalyService anomalyService;

    private static final BigDecimal DEFAULT_SPECIFIC_GRAVITY = new BigDecimal("2.70");

    private static final Map<TestStatus, Set<TestStatus>> TRANSITIONS = new EnumMap<>(TestStatus.class);

    static {
        TRANSITIONS.put(DRAFT, EnumSet.of(IN_PROGRESS, PENDING_REVIEW));
        TRANSITIONS.put(IN_PROGRESS, EnumSet.of(PENDING_REVIEW));
        TRANSITIONS.put(PENDING_REVIEW, EnumSet.of(APPROVED, REJECTED, IN_PROGRESS));
        TRANSITIONS.put(APPROVED, EnumSet.noneOf(TestStatus.class));
        TRANSITIONS.put(REJECTED, EnumSet.of(IN_PROGRESS));
    }

    @Transactional
    public PsTestResponse create(PsTestCreateDto dto, UUID technicianId) {
        PsTestType testType = PsTestType.valueOf(dto.testType().toUpperCase());
        BigDecimal specificGravity = dto.specificGravity() != null
                ? dto.specificGravity() : DEFAULT_SPECIFIC_GRAVITY;
        BigDecimal totalDryMassG = resolveTotalDryMass(dto);

        // Build entity
        PsTest test = PsTest.builder()
                .sampleId(dto.sampleId())
                .projectId(dto.projectId())
                .boreholeId(dto.boreholeId())
                .technicianId(technicianId)
                .status(DRAFT)
                .testType(testType)
                .sampleMassG(dto.sampleMassG())
                .waterContentPct(dto.waterContentPct())
                .totalDryMassG(totalDryMassG)
                .specificGravity(specificGravity)
                .materialType(dto.materialType())
                .applicableNorm(dto.applicableNorm())
                .notes(dto.notes())
                .aiFlag(AiFlag.NONE)
                .build();

        // Calculate sieve results
        List<PsSieveResult> sieveResults = calculationService.calculateSieveResults(
                dto.sieveResults(), totalDryMassG);
        for (PsSieveResult r : sieveResults) {
            r.setPsTest(test);
            test.getSieveResults().add(r);
        }

        // Calculate hydrometer readings
        List<PsHydrometerReading> hydroReadings = calculationService.calculateHydrometerReadings(
                dto.hydrometerReadings(), totalDryMassG, specificGravity);
        for (PsHydrometerReading r : hydroReadings) {
            r.setPsTest(test);
            test.getHydrometerReadings().add(r);
        }

        // Calculate fractions
        PsCalculationService.PsFractions fractions = calculationService.calculateFractions(sieveResults);
        test.setPctGravel(fractions.pctGravel());
        test.setPctSand(fractions.pctSand());
        test.setPctFines(fractions.pctFines());

        // Calculate characteristic diameters
        List<PsCalculationService.GradationPoint> allPoints =
                calculationService.buildGradationPoints(sieveResults, hydroReadings);
        PsCalculationService.PsDiameters diameters =
                calculationService.calculateCharacteristicDiameters(allPoints);
        test.setD10Mm(diameters.d10());
        test.setD30Mm(diameters.d30());
        test.setD60Mm(diameters.d60());
        test.setCu(diameters.cu());
        test.setCc(diameters.cc());

        // USCS classification
        PsCalculationService.PsUscsResult uscs = calculationService.classifyUscs(
                fractions.pctGravel(), fractions.pctSand(), fractions.pctFines(),
                diameters.cu(), diameters.cc());
        test.setUscsSymbol(uscs.symbol());
        test.setUscsName(uscs.name());

        // Anomaly detection
        PsAnomalyService.AnomalyResult anomaly = anomalyService.analyze(
                sieveResults, hydroReadings, dto.totalDryMassG(), testType);
        // Additional Cc check
        anomaly = anomalyService.checkCoefficients(diameters.cc(), anomaly);
        test.setAiFlag(anomaly.flag());
        test.setAiFlagMessage(anomaly.message());

        return PsTestResponse.from(repository.save(test));
    }

    @Transactional(readOnly = true)
    public PsTestResponse getById(UUID id) {
        return PsTestResponse.from(findOrThrow(id));
    }

    @Transactional(readOnly = true)
    public List<PsTestResponse> getBySampleId(UUID sampleId) {
        return repository.findAllBySampleId(sampleId).stream()
                .map(PsTestResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public Page<PsTestResponse> getByProjectId(UUID projectId, Pageable pageable) {
        return repository.findAllByProjectId(projectId, pageable).map(PsTestResponse::from);
    }

    @Transactional
    public PsTestResponse updateStatus(UUID id, TestStatus newStatus, UUID requestingUserId) {
        PsTest test = findOrThrow(id);
        Set<TestStatus> allowed = TRANSITIONS.getOrDefault(test.getStatus(), EnumSet.noneOf(TestStatus.class));
        if (!allowed.contains(newStatus)) {
            throw new InvalidStatusTransitionException(
                    "Cannot transition from " + test.getStatus() + " to " + newStatus);
        }
        test.setStatus(newStatus);
        return PsTestResponse.from(repository.save(test));
    }

    @Transactional(readOnly = true)
    public Optional<PsTestResponse> getLatestBySampleId(UUID sampleId) {
        return repository.findFirstBySampleIdOrderByCreatedAtDesc(sampleId)
                .map(PsTestResponse::from);
    }

    @Transactional
    public void softDelete(UUID id) {
        PsTest test = findOrThrow(id);
        test.setDeleted(true);
        repository.save(test);
    }

    @Transactional
    public PsTestResponse update(UUID id, PsTestCreateDto dto) {
        PsTest test = findOrThrow(id);
        PsTestType testType = PsTestType.valueOf(dto.testType().toUpperCase());
        BigDecimal specificGravity = dto.specificGravity() != null
                ? dto.specificGravity() : DEFAULT_SPECIFIC_GRAVITY;
        BigDecimal totalDryMassG = resolveTotalDryMass(dto);

        test.getSieveResults().clear();
        List<PsSieveResult> sieveResults = calculationService.calculateSieveResults(
                dto.sieveResults(), totalDryMassG);
        for (PsSieveResult r : sieveResults) {
            r.setPsTest(test);
            test.getSieveResults().add(r);
        }

        test.getHydrometerReadings().clear();
        List<PsHydrometerReading> hydroReadings = calculationService.calculateHydrometerReadings(
                dto.hydrometerReadings(), totalDryMassG, specificGravity);
        for (PsHydrometerReading r : hydroReadings) {
            r.setPsTest(test);
            test.getHydrometerReadings().add(r);
        }

        test.setTestType(testType);
        test.setSampleMassG(dto.sampleMassG());
        test.setWaterContentPct(dto.waterContentPct());
        test.setTotalDryMassG(totalDryMassG);
        test.setSpecificGravity(specificGravity);
        test.setMaterialType(dto.materialType());
        test.setApplicableNorm(dto.applicableNorm());
        test.setNotes(dto.notes());

        PsCalculationService.PsFractions fractions = calculationService.calculateFractions(sieveResults);
        test.setPctGravel(fractions.pctGravel());
        test.setPctSand(fractions.pctSand());
        test.setPctFines(fractions.pctFines());

        List<PsCalculationService.GradationPoint> allPoints =
                calculationService.buildGradationPoints(sieveResults, hydroReadings);
        PsCalculationService.PsDiameters diameters =
                calculationService.calculateCharacteristicDiameters(allPoints);
        test.setD10Mm(diameters.d10());
        test.setD30Mm(diameters.d30());
        test.setD60Mm(diameters.d60());
        test.setCu(diameters.cu());
        test.setCc(diameters.cc());

        PsCalculationService.PsUscsResult uscs = calculationService.classifyUscs(
                fractions.pctGravel(), fractions.pctSand(), fractions.pctFines(),
                diameters.cu(), diameters.cc());
        test.setUscsSymbol(uscs.symbol());
        test.setUscsName(uscs.name());

        PsAnomalyService.AnomalyResult anomaly = anomalyService.analyze(
                sieveResults, hydroReadings, totalDryMassG, testType);
        anomaly = anomalyService.checkCoefficients(diameters.cc(), anomaly);
        test.setAiFlag(anomaly.flag());
        test.setAiFlagMessage(anomaly.message());

        return PsTestResponse.from(repository.save(test));
    }

    private BigDecimal resolveTotalDryMass(PsTestCreateDto dto) {
        if (dto.sampleMassG() != null && dto.waterContentPct() != null) {
            BigDecimal divisor = BigDecimal.ONE.add(
                    dto.waterContentPct().divide(new BigDecimal("100"), 10, java.math.RoundingMode.HALF_UP));
            return dto.sampleMassG().divide(divisor, 3, java.math.RoundingMode.HALF_UP);
        }
        if (dto.totalDryMassG() == null) {
            throw new IllegalArgumentException(
                    "Either sampleMassG + waterContentPct or totalDryMassG must be provided");
        }
        return dto.totalDryMassG();
    }

    private PsTest findOrThrow(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Particle size test not found: " + id));
    }
}
