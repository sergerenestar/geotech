package com.lab.geotech.testProctor.service;

import com.lab.geotech.testProctor.constant.AiFlag;
import com.lab.geotech.testProctor.entity.ProctorPoint;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

/**
 * Anomaly detection for Proctor compaction tests.
 * Checks are ordered WARNING-only (no ERROR conditions in spec).
 */
@Service
public class ProctorAnomalyService {

    private static final BigDecimal GD_MIN = BigDecimal.valueOf(12);
    private static final BigDecimal GD_MAX = BigDecimal.valueOf(23);
    private static final BigDecimal OMC_MIN = BigDecimal.valueOf(5);
    private static final BigDecimal OMC_MAX = BigDecimal.valueOf(40);
    private static final BigDecimal R2_THRESHOLD = new BigDecimal("0.90");

    public record AnomalyResult(AiFlag flag, String message) {}

    /**
     * Evaluates all anomaly conditions and returns the first (highest-priority) finding.
     *
     * @param gdMax   computed γd_max (kN/m³), may be null
     * @param omc     computed OMC (%), may be null
     * @param rSquared polynomial R², may be null
     * @param points  list of measured compaction points
     */
    public AnomalyResult analyze(BigDecimal gdMax, BigDecimal omc,
                                  BigDecimal rSquared, List<ProctorPoint> points) {

        if (gdMax != null) {
            if (gdMax.compareTo(GD_MIN) < 0) {
                return new AnomalyResult(AiFlag.WARNING,
                        "Unusually low dry density: γd_max = " + gdMax + " kN/m³");
            }
            if (gdMax.compareTo(GD_MAX) > 0) {
                return new AnomalyResult(AiFlag.WARNING,
                        "Unusually high dry density: γd_max = " + gdMax + " kN/m³");
            }
        }

        if (omc != null) {
            if (omc.compareTo(OMC_MIN) < 0) {
                return new AnomalyResult(AiFlag.WARNING,
                        "Unusually low optimum moisture content: OMC = " + omc + "%");
            }
            if (omc.compareTo(OMC_MAX) > 0) {
                return new AnomalyResult(AiFlag.WARNING,
                        "Unusually high optimum moisture content: OMC = " + omc + "%");
            }
        }

        if (rSquared != null && rSquared.compareTo(R2_THRESHOLD) < 0) {
            return new AnomalyResult(AiFlag.WARNING,
                    "Poor curve fit — verify data points (R² = " + rSquared + ")");
        }

        if (points != null && points.size() < 5) {
            return new AnomalyResult(AiFlag.WARNING,
                    "Minimum 5 compaction points recommended (found " + points.size() + ")");
        }

        // OMC extrapolated beyond measured water content range
        if (omc != null && points != null && !points.isEmpty()) {
            double minW = points.stream()
                    .mapToDouble(p -> p.getWaterContentPct().doubleValue())
                    .min().orElse(Double.NaN);
            double maxW = points.stream()
                    .mapToDouble(p -> p.getWaterContentPct().doubleValue())
                    .max().orElse(Double.NaN);
            double omcVal = omc.doubleValue();
            if (!Double.isNaN(minW) && (omcVal < minW || omcVal > maxW)) {
                return new AnomalyResult(AiFlag.WARNING,
                        "OMC extrapolated beyond measured data range ["
                                + BigDecimal.valueOf(minW).setScale(1, java.math.RoundingMode.HALF_UP)
                                + "%, "
                                + BigDecimal.valueOf(maxW).setScale(1, java.math.RoundingMode.HALF_UP)
                                + "%]");
            }
        }

        return new AnomalyResult(AiFlag.NONE, null);
    }
}
