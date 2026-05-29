package com.lab.geotech.testDs.service;

import com.lab.geotech.testDs.constant.AiFlag;
import com.lab.geotech.testDs.entity.DsStage;
import com.lab.geotech.testDs.entity.DsTest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Slf4j
@Service
public class DsAnomalyService {

    private static final BigDecimal ZERO = BigDecimal.ZERO;
    private static final BigDecimal FIFTY = new BigDecimal("50");
    private static final BigDecimal TWO_HUNDRED = new BigDecimal("200");
    private static final BigDecimal ZERO_POINT_NINE = new BigDecimal("0.90");
    private static final BigDecimal FIFTY_KPA = new BigDecimal("50");

    /**
     * Evaluates anomaly rules and sets aiFlag / aiFlagMessage on the test.
     */
    public void analyze(DsTest test) {
        List<String> errors = new ArrayList<>();
        List<String> warnings = new ArrayList<>();

        BigDecimal phi = test.getFrictionAngleDeg();
        BigDecimal cohesion = test.getCohesionKpa();
        BigDecimal rSquared = test.getRSquared();
        List<DsStage> stages = test.getStages();

        // Rule: φ < 0° → ERROR
        if (phi != null && phi.compareTo(ZERO) < 0) {
            errors.add("Friction angle cannot be negative");
        }

        // Rule: φ > 50° → WARNING
        if (phi != null && phi.compareTo(FIFTY) > 0) {
            warnings.add("Friction angle unusually high");
        }

        // Rule: c < 0 kPa → WARNING
        if (cohesion != null && cohesion.compareTo(ZERO) < 0) {
            warnings.add("Negative cohesion from regression — verify data");
        }

        // Rule: c > 200 kPa → WARNING
        if (cohesion != null && cohesion.compareTo(TWO_HUNDRED) > 0) {
            warnings.add("Very high apparent cohesion — verify normal stress range");
        }

        // Rule: R² < 0.90 → WARNING
        if (rSquared != null && rSquared.compareTo(ZERO_POINT_NINE) < 0) {
            warnings.add("Poor Mohr-Coulomb fit — data may not be collinear");
        }

        // Rule: stages.size() < 3 → WARNING
        if (stages.size() < 3) {
            warnings.add("Minimum 3 stages recommended for reliable c and φ");
        }

        // Rule: (max_normal_stress - min_normal_stress) < 50 kPa → WARNING
        if (stages.size() >= 2) {
            BigDecimal maxNormal = stages.stream()
                    .map(DsStage::getNormalStressKpa)
                    .max(Comparator.naturalOrder())
                    .orElse(ZERO);
            BigDecimal minNormal = stages.stream()
                    .map(DsStage::getNormalStressKpa)
                    .min(Comparator.naturalOrder())
                    .orElse(ZERO);
            if (maxNormal.subtract(minNormal).compareTo(FIFTY_KPA) < 0) {
                warnings.add("Normal stress range too narrow for reliable regression");
            }
        }

        // Set flag and message
        if (!errors.isEmpty()) {
            test.setAiFlag(AiFlag.ERROR);
            test.setAiFlagMessage(String.join("; ", errors));
        } else if (!warnings.isEmpty()) {
            test.setAiFlag(AiFlag.WARNING);
            test.setAiFlagMessage(String.join("; ", warnings));
        } else {
            test.setAiFlag(AiFlag.NONE);
            test.setAiFlagMessage(null);
        }
    }
}
