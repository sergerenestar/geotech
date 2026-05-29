package com.lab.geotech.testLl.service;

import com.lab.geotech.testLl.constant.AiFlag;
import com.lab.geotech.testLl.entity.LlCasagrandePoint;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class LlAnomalyService {

    private static final BigDecimal ZERO = BigDecimal.ZERO;
    private static final BigDecimal TWO_HUNDRED = BigDecimal.valueOf(200);
    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);
    private static final BigDecimal R2_THRESHOLD = new BigDecimal("0.90");

    public record AnomalyResult(AiFlag flag, String message) {}

    /**
     * Evaluates anomaly conditions per ASTM D-4318 spec.
     * Returns the highest-severity finding (ERROR > WARNING > NONE).
     */
    public AnomalyResult analyze(BigDecimal ll, BigDecimal pl, BigDecimal pi,
                                  BigDecimal r2, List<LlCasagrandePoint> points) {
        // ERROR conditions
        if (ll != null && (ll.compareTo(ZERO) < 0 || ll.compareTo(TWO_HUNDRED) > 0)) {
            return new AnomalyResult(AiFlag.ERROR,
                    "LL out of valid range [0, 200]: " + ll + "%");
        }
        if (pl != null && pl.compareTo(ZERO) < 0) {
            return new AnomalyResult(AiFlag.ERROR,
                    "PL is negative: " + pl + "% — check mass inputs");
        }
        if (pl != null && ll != null && pl.compareTo(ll) > 0) {
            return new AnomalyResult(AiFlag.ERROR,
                    "PL (" + pl + "%) exceeds LL (" + ll + "%) — physically impossible");
        }
        if (pi != null && pi.compareTo(ZERO) < 0) {
            return new AnomalyResult(AiFlag.ERROR,
                    "PI is negative: " + pi + "% — check LL/PL values");
        }

        // WARNING conditions
        if (pi != null && pi.compareTo(HUNDRED) > 0) {
            return new AnomalyResult(AiFlag.WARNING,
                    "PI exceeds 100% (" + pi + "%) — unusually high plasticity");
        }

        if (points != null) {
            for (LlCasagrandePoint p : points) {
                if (p.getBlowCount() < 2 || p.getBlowCount() > 45) {
                    return new AnomalyResult(AiFlag.WARNING,
                            "Blow count " + p.getBlowCount() + " at point #" + p.getPointNumber()
                                    + " is outside valid range [2, 45]");
                }
            }
            if (points.size() < 3) {
                return new AnomalyResult(AiFlag.WARNING,
                        "Only " + points.size() + " Casagrande point(s) recorded — minimum 3 recommended");
            }
        }

        if (r2 != null && r2.compareTo(R2_THRESHOLD) < 0) {
            return new AnomalyResult(AiFlag.WARNING,
                    "R² = " + r2 + " is below 0.90 — regression fit is poor");
        }

        return new AnomalyResult(AiFlag.NONE, null);
    }
}
