package com.lab.geotech.testLl.service;

import java.math.BigDecimal;

/**
 * USCS classification from ASTM D-4318 plasticity chart.
 * A-line: PI = 0.73 * (LL - 20)
 * U-line: PI = 0.9 * (LL - 8)
 */
public final class UscsClassifier {

    private UscsClassifier() {}

    public record UscsResult(String symbol, String name) {}

    public static UscsResult classify(BigDecimal llBd, BigDecimal piBd) {
        if (llBd == null || piBd == null) return new UscsResult(null, null);

        double ll = llBd.doubleValue();
        double pi = piBd.doubleValue();

        // Non-plastic: PI ≤ 4
        if (pi <= 4.0) {
            return new UscsResult("ML", "Silt of low plasticity");
        }

        double aLine = 0.73 * (ll - 20.0);

        if (ll < 50.0) {
            if (pi < aLine) {
                return new UscsResult("ML", "Silt of low plasticity");
            } else if (Math.abs(pi - aLine) <= 2.0) {
                return new UscsResult("CL-ML", "Silty clay");
            } else {
                return new UscsResult("CL", "Lean clay");
            }
        } else {
            // LL >= 50
            if (pi < aLine) {
                return new UscsResult("MH", "Elastic silt");
            } else {
                return new UscsResult("CH", "Fat clay");
            }
        }
    }
}
