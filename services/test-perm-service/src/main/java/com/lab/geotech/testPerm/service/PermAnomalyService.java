package com.lab.geotech.testPerm.service;

import com.lab.geotech.testPerm.constant.AiFlag;
import com.lab.geotech.testPerm.entity.PermReading;
import com.lab.geotech.testPerm.entity.PermTest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
public class PermAnomalyService {

    private static final BigDecimal K_VERY_LOW = new BigDecimal("1e-8");
    private static final BigDecimal K_VERY_HIGH = new BigDecimal("0.1");
    private static final double COV_THRESHOLD = 0.5;

    public void analyze(PermTest test) {
        List<String> warnings = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        // Collect all non-null kCms reading values
        List<BigDecimal> kValues = test.getReadings().stream()
                .map(PermReading::getKCms)
                .filter(k -> k != null)
                .toList();

        // If count >= 2: compute mean and std dev
        if (kValues.size() >= 2) {
            double mean = kValues.stream().mapToDouble(BigDecimal::doubleValue).average().orElse(0.0);
            double sumSq = kValues.stream().mapToDouble(v -> Math.pow(v.doubleValue() - mean, 2)).sum();
            double stdDev = Math.sqrt(sumSq / kValues.size());
            if (mean > 0) {
                double cov = stdDev / mean;
                if (cov > COV_THRESHOLD) {
                    warnings.add("Coefficient de variation des mesures > 50%");
                }
            }
        }

        BigDecimal kAt20c = test.getKAt20cCms();
        if (kAt20c != null) {
            if (kAt20c.compareTo(K_VERY_LOW) < 0) {
                warnings.add("k très faible, possible colmatage");
            }
            if (kAt20c.compareTo(K_VERY_HIGH) > 0) {
                warnings.add("k très élevé, vérifier la présence de renard");
            }
        }

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
