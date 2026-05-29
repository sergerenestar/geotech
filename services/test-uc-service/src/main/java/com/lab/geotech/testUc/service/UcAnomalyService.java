package com.lab.geotech.testUc.service;

import com.lab.geotech.testUc.constant.AiFlag;
import com.lab.geotech.testUc.entity.UcReading;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

/**
 * Evaluates anomaly conditions for an Unconfined Compression test per ASTM D-2166.
 */
@Service
public class UcAnomalyService {

    private static final BigDecimal QU_LOW  = BigDecimal.valueOf(5);
    private static final BigDecimal QU_HIGH = BigDecimal.valueOf(600);
    private static final BigDecimal STRAIN_BRITTLE = BigDecimal.ONE;
    private static final BigDecimal STRAIN_HARDENING = BigDecimal.valueOf(15);

    public record AnomalyResult(AiFlag flag, String message) {}

    /**
     * Runs all anomaly checks and returns the highest-severity result.
     *
     * @param quKpa             computed qu (kPa)
     * @param failureStrainPct  computed failure strain (%)
     * @param readings          fully computed readings list
     * @param quTakenAt15       true when qu was taken at 15% strain (no clear peak)
     * @return AnomalyResult with AiFlag and descriptive message (null message for NONE)
     */
    public AnomalyResult analyze(BigDecimal quKpa,
                                 BigDecimal failureStrainPct,
                                 List<UcReading> readings,
                                 boolean quTakenAt15) {

        // ERROR: no load recorded at all
        if (readings != null) {
            boolean allZeroLoad = readings.stream()
                    .allMatch(r -> r.getProvingRingDiv() == null
                            || r.getProvingRingDiv().compareTo(BigDecimal.ZERO) == 0);
            if (allZeroLoad) {
                return new AnomalyResult(AiFlag.ERROR,
                        "No load recorded — check calibration factor");
            }
        }

        // WARNING: non-zero start on deformation gauge
        if (readings != null && !readings.isEmpty()) {
            UcReading first = readings.get(0);
            if (first.getDeformationDiv() != null
                    && first.getDeformationDiv().compareTo(BigDecimal.ZERO) != 0) {
                return new AnomalyResult(AiFlag.WARNING,
                        "Non-zero start — verify gauge zeroing");
            }
        }

        // WARNING: very soft clay
        if (quKpa != null && quKpa.compareTo(QU_LOW) < 0) {
            return new AnomalyResult(AiFlag.WARNING,
                    "Very soft clay — verify specimen disturbance");
        }

        // WARNING: very stiff soil
        if (quKpa != null && quKpa.compareTo(QU_HIGH) > 0) {
            return new AnomalyResult(AiFlag.WARNING,
                    "Very stiff soil — verify sample is undisturbed cohesive soil");
        }

        // WARNING (stored as WARNING): strain-hardening — qu taken at 15%
        if (quTakenAt15) {
            return new AnomalyResult(AiFlag.WARNING,
                    "Strain-hardening behavior — qu taken at 15% strain per ASTM");
        }

        // WARNING: brittle failure
        if (failureStrainPct != null && failureStrainPct.compareTo(STRAIN_BRITTLE) < 0) {
            return new AnomalyResult(AiFlag.WARNING,
                    "Brittle failure — check specimen preparation");
        }

        return new AnomalyResult(AiFlag.NONE, null);
    }
}
