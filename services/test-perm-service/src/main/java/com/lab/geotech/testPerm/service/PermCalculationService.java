package com.lab.geotech.testPerm.service;

import com.lab.geotech.testPerm.constant.TestType;
import com.lab.geotech.testPerm.dto.PermReadingInputDto;
import com.lab.geotech.testPerm.entity.PermReading;
import com.lab.geotech.testPerm.entity.PermTest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
public class PermCalculationService {

    private static final BigDecimal PI = BigDecimal.valueOf(Math.PI);
    private static final RoundingMode ROUNDING = RoundingMode.HALF_UP;

    public void calculate(PermTest test, List<PermReadingInputDto> readingInputs) {
        // A_cm2 = PI * (D_mm / 20)^2
        BigDecimal radiusCm = test.getSpecimenDiameterMm().divide(BigDecimal.valueOf(20), 10, ROUNDING);
        BigDecimal aCm2 = PI.multiply(radiusCm.multiply(radiusCm)).setScale(6, ROUNDING);
        // L_cm = L_mm / 10
        BigDecimal lCm = test.getSpecimenLengthMm().divide(BigDecimal.TEN, 6, ROUNDING);

        List<PermReading> readings = test.getReadings();
        List<BigDecimal> kValues = new ArrayList<>();

        for (int i = 0; i < readings.size(); i++) {
            PermReading reading = readings.get(i);
            BigDecimal kCms = null;
            if (test.getTestType() == TestType.CONSTANT_HEAD) {
                // k = (Q × L) / (A × h × t)
                if (reading.getFlowVolumeMl() != null && test.getHeadCm() != null
                        && reading.getElapsedTimeS().compareTo(BigDecimal.ZERO) > 0) {
                    kCms = reading.getFlowVolumeMl().multiply(lCm)
                            .divide(aCm2.multiply(test.getHeadCm()).multiply(reading.getElapsedTimeS()), 12, ROUNDING);
                }
            } else {
                // k = (a × L / (A × t)) × ln(h1 / h2)
                if (test.getStandpipeAreaCm2() != null && reading.getInitialHeadCm() != null
                        && reading.getFinalHeadCm() != null
                        && reading.getFinalHeadCm().compareTo(BigDecimal.ZERO) > 0
                        && reading.getElapsedTimeS().compareTo(BigDecimal.ZERO) > 0) {
                    double ratio = reading.getInitialHeadCm().doubleValue() / reading.getFinalHeadCm().doubleValue();
                    if (ratio > 0) {
                        BigDecimal lnRatio = BigDecimal.valueOf(Math.log(ratio));
                        kCms = test.getStandpipeAreaCm2().multiply(lCm)
                                .divide(aCm2.multiply(reading.getElapsedTimeS()), 12, ROUNDING)
                                .multiply(lnRatio).setScale(12, ROUNDING);
                    }
                }
            }
            reading.setKCms(kCms != null ? kCms.setScale(10, ROUNDING) : null);
            if (kCms != null) kValues.add(kCms);
        }

        // Average k
        if (!kValues.isEmpty()) {
            BigDecimal sum = kValues.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal avgK = sum.divide(BigDecimal.valueOf(kValues.size()), 10, ROUNDING);
            test.setKCms(avgK);
            // Temperature correction: k_20 = k_T × RT
            double T = test.getWaterTemperatureC().doubleValue();
            double numerator = 2.1482 * (T - 8.435) + Math.sqrt(8078.4 + Math.pow(T - 8.435, 2)) - 120;
            double denominator = 2.1482 * (20 - 8.435) + Math.sqrt(8078.4 + Math.pow(20 - 8.435, 2)) - 120;
            double RT = (denominator != 0) ? numerator / denominator : 1.0;
            test.setKAt20cCms(avgK.multiply(BigDecimal.valueOf(RT)).setScale(10, ROUNDING));
        } else {
            test.setKCms(null);
            test.setKAt20cCms(null);
        }
    }
}
