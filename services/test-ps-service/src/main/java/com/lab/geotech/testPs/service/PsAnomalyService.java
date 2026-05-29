package com.lab.geotech.testPs.service;

import com.lab.geotech.testPs.constant.AiFlag;
import com.lab.geotech.testPs.constant.PsTestType;
import com.lab.geotech.testPs.entity.PsHydrometerReading;
import com.lab.geotech.testPs.entity.PsSieveResult;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
public class PsAnomalyService {

    private static final BigDecimal MIN_TEMP = BigDecimal.valueOf(15);
    private static final BigDecimal MAX_TEMP = BigDecimal.valueOf(30);
    private static final BigDecimal MIN_MASS_HYDROMETER = BigDecimal.valueOf(50);
    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);
    private static final BigDecimal MASS_LOSS_UPPER = BigDecimal.valueOf(102);
    private static final BigDecimal MASS_LOSS_LOWER = BigDecimal.valueOf(98);

    public record AnomalyResult(AiFlag flag, String message) {}

    /**
     * Analyze a completed set of sieve + hydrometer results for anomalies.
     * Returns the highest-severity anomaly found (ERROR > WARNING > NONE).
     */
    public AnomalyResult analyze(List<PsSieveResult> sieveResults,
                                  List<PsHydrometerReading> hydrometerReadings,
                                  BigDecimal totalDryMassG,
                                  PsTestType testType) {
        List<String> warnings = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        // Check cumulative mass balance (sieve totals)
        if (sieveResults != null && !sieveResults.isEmpty()) {
            BigDecimal cumulativeRetained = sieveResults.stream()
                    .map(PsSieveResult::getPctRetained)
                    .filter(v -> v != null)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            // The sum of all retained percentages plus what passes No.200
            // should be around 100%. Check the last (finest) sieve pct_finer
            BigDecimal smallestPctFiner = sieveResults.stream()
                    .min((a, b) -> a.getOpeningMm().compareTo(b.getOpeningMm()))
                    .map(PsSieveResult::getPctFiner)
                    .orElse(null);

            BigDecimal totalAccounted = cumulativeRetained;
            if (smallestPctFiner != null) {
                totalAccounted = cumulativeRetained.add(smallestPctFiner);
            }

            if (totalAccounted.compareTo(MASS_LOSS_UPPER) > 0) {
                warnings.add(String.format(
                        "Cumulative mass balance is %.1f%% — exceeds 102%% (possible scale error or soil gain)",
                        totalAccounted.doubleValue()));
            } else if (totalAccounted.compareTo(MASS_LOSS_LOWER) < 0) {
                warnings.add(String.format(
                        "Cumulative mass balance is %.1f%% — below 98%% (possible soil loss during sieving)",
                        totalAccounted.doubleValue()));
            }
        }

        // Check hydrometer temperature out of range
        if (hydrometerReadings != null) {
            for (PsHydrometerReading r : hydrometerReadings) {
                if (r.getTemperatureC() != null) {
                    if (r.getTemperatureC().compareTo(MIN_TEMP) < 0
                            || r.getTemperatureC().compareTo(MAX_TEMP) > 0) {
                        warnings.add(String.format(
                                "Hydrometer reading #%d: temperature %.1f°C is outside recommended 15-30°C range",
                                r.getReadingNumber(), r.getTemperatureC().doubleValue()));
                        break; // one warning is sufficient
                    }
                }
            }
        }

        // Check total dry mass too small for hydrometer test
        if ((testType == PsTestType.HYDROMETER || testType == PsTestType.COMBINED)
                && totalDryMassG != null
                && totalDryMassG.compareTo(MIN_MASS_HYDROMETER) < 0) {
            warnings.add(String.format(
                    "Total dry mass %.1fg is below 50g for hydrometer test — results may be unreliable",
                    totalDryMassG.doubleValue()));
        }

        // Check Cc < 0 (should not occur physically but guard against calculation errors)
        // Cc is not available at anomaly check time; it's checked after diameter calculation
        // This check can be extended in PsTestService if needed.

        if (!errors.isEmpty()) {
            return new AnomalyResult(AiFlag.ERROR, String.join("; ", errors));
        }
        if (!warnings.isEmpty()) {
            return new AnomalyResult(AiFlag.WARNING, String.join("; ", warnings));
        }
        return new AnomalyResult(AiFlag.NONE, null);
    }

    /**
     * Additional check: Cc < 0 is physically impossible — return ERROR.
     */
    public AnomalyResult checkCoefficients(BigDecimal cc, AnomalyResult existing) {
        if (cc != null && cc.compareTo(BigDecimal.ZERO) < 0) {
            return new AnomalyResult(AiFlag.ERROR,
                    "Coefficient of curvature Cc is negative (" + cc + ") — check gradation data");
        }
        return existing;
    }
}
