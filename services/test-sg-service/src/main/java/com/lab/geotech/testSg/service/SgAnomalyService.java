package com.lab.geotech.testSg.service;

import com.lab.geotech.testSg.constant.AiFlag;
import com.lab.geotech.testSg.entity.SgDetermination;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

/**
 * Anomaly detection service for ASTM D-854 specific gravity tests.
 * Severity hierarchy: ERROR > WARNING > NONE.
 * All triggered messages are collected; worst flag is returned.
 */
@Service
public class SgAnomalyService {

    private static final BigDecimal MIN_RANGE_WARN  = new BigDecimal("2.50");
    private static final BigDecimal MAX_RANGE_WARN  = new BigDecimal("2.90");
    private static final BigDecimal MIN_PLAUSIBLE   = new BigDecimal("2.0");
    private static final BigDecimal MAX_PLAUSIBLE   = new BigDecimal("3.2");
    private static final BigDecimal MAX_DET_SPREAD  = new BigDecimal("0.030");
    private static final BigDecimal TEMP_MIN        = new BigDecimal("15");
    private static final BigDecimal TEMP_MAX        = new BigDecimal("30");

    public record AnomalyResult(AiFlag flag, String message) {}

    /**
     * Evaluates all anomaly rules and returns the combined result.
     *
     * @param gsAverage      average Gs_20 across all determinations
     * @param determinations individual determination entities (with gs20 already set)
     */
    public AnomalyResult analyze(BigDecimal gsAverage, List<SgDetermination> determinations) {
        List<String> warnings = new ArrayList<>();
        List<String> errors   = new ArrayList<>();

        // --- count check ---
        if (determinations == null || determinations.size() < 2) {
            warnings.add("Minimum 2 determinations recommended");
        }

        // --- temperature range check ---
        if (determinations != null) {
            for (SgDetermination det : determinations) {
                BigDecimal temp = det.getTemperatureC();
                if (temp != null && (temp.compareTo(TEMP_MIN) < 0 || temp.compareTo(TEMP_MAX) > 0)) {
                    warnings.add("Temperature outside correction table range: " + temp + "°C at determination #"
                            + det.getDeterminationNumber());
                }
            }
        }

        if (gsAverage != null) {
            // --- plausibility error ---
            if (gsAverage.compareTo(MIN_PLAUSIBLE) < 0 || gsAverage.compareTo(MAX_PLAUSIBLE) > 0) {
                errors.add("Value outside physically plausible range: Gs_avg = " + gsAverage);
            }

            // --- typical-range warnings ---
            if (gsAverage.compareTo(MIN_RANGE_WARN) < 0) {
                warnings.add("Specific gravity below typical range for mineral soils: Gs_avg = " + gsAverage);
            } else if (gsAverage.compareTo(MAX_RANGE_WARN) > 0) {
                warnings.add("Specific gravity above typical range — verify for heavy minerals: Gs_avg = " + gsAverage);
            }

            // --- individual determination deviation ---
            if (determinations != null) {
                for (SgDetermination det : determinations) {
                    if (det.getGs20() != null) {
                        BigDecimal deviation = det.getGs20().subtract(gsAverage).abs()
                                .setScale(4, RoundingMode.HALF_UP);
                        if (deviation.compareTo(MAX_DET_SPREAD) > 0) {
                            warnings.add("Determination #" + det.getDeterminationNumber()
                                    + " deviates significantly from average (|Gs_i - Gs_avg| = "
                                    + deviation + ")");
                        }
                    }
                }
            }
        }

        // --- build result ---
        if (!errors.isEmpty()) {
            String msg = String.join("; ", errors);
            if (!warnings.isEmpty()) {
                msg = msg + "; " + String.join("; ", warnings);
            }
            return new AnomalyResult(AiFlag.ERROR, msg);
        }
        if (!warnings.isEmpty()) {
            return new AnomalyResult(AiFlag.WARNING, String.join("; ", warnings));
        }
        return new AnomalyResult(AiFlag.NONE, null);
    }
}
