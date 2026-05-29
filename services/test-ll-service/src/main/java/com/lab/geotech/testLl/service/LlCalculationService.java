package com.lab.geotech.testLl.service;

import com.lab.geotech.testLl.constant.TestMethod;
import com.lab.geotech.testLl.dto.CasagrandePointInputDto;
import com.lab.geotech.testLl.dto.PlDeterminationInputDto;
import com.lab.geotech.testLl.entity.LlCasagrandePoint;
import com.lab.geotech.testLl.entity.LlPlDetermination;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
public class LlCalculationService {

    private static final int SCALE = 3;
    private static final int RSQUARED_SCALE = 6;
    private static final RoundingMode ROUNDING = RoundingMode.HALF_UP;

    /**
     * Calculates water content for a single Casagrande point and returns
     * an LlCasagrandePoint with all fields populated (test_id not yet set).
     */
    public LlCasagrandePoint calculateCasagrandePoint(CasagrandePointInputDto dto, int pointNumber) {
        BigDecimal mWater = dto.massContainerWetSoilG().subtract(dto.massContainerDrySoilG());
        BigDecimal mDry = dto.massContainerDrySoilG().subtract(dto.massContainerG());

        BigDecimal waterContentPct = null;
        if (mDry.compareTo(BigDecimal.ZERO) != 0) {
            waterContentPct = mWater.divide(mDry, SCALE, ROUNDING)
                    .multiply(BigDecimal.valueOf(100));
        }

        LlCasagrandePoint point = new LlCasagrandePoint();
        point.setPointNumber(pointNumber);
        point.setBlowCount(dto.blowCount());
        point.setMassContainerG(dto.massContainerG());
        point.setMassContainerWetSoilG(dto.massContainerWetSoilG());
        point.setMassContainerDrySoilG(dto.massContainerDrySoilG());
        point.setWaterContentPct(waterContentPct);
        return point;
    }

    /**
     * Calculates water content for a single PL determination and returns
     * an LlPlDetermination with all fields populated (test_id not yet set).
     */
    public LlPlDetermination calculatePlDetermination(PlDeterminationInputDto dto, int determinationNumber) {
        BigDecimal mWater = dto.massContainerWetSoilG().subtract(dto.massContainerDrySoilG());
        BigDecimal mDry = dto.massContainerDrySoilG().subtract(dto.massContainerG());

        BigDecimal waterContentPct = null;
        if (mDry.compareTo(BigDecimal.ZERO) != 0) {
            waterContentPct = mWater.divide(mDry, SCALE, ROUNDING)
                    .multiply(BigDecimal.valueOf(100));
        }

        LlPlDetermination det = new LlPlDetermination();
        det.setDeterminationNumber(determinationNumber);
        det.setMassContainerG(dto.massContainerG());
        det.setMassContainerWetSoilG(dto.massContainerWetSoilG());
        det.setMassContainerDrySoilG(dto.massContainerDrySoilG());
        det.setWaterContentPct(waterContentPct);
        return det;
    }

    /**
     * Calculates the Liquid Limit from Casagrande points.
     * MULTI_POINT: log-linear regression on (log10(blows), w%).
     * ONE_POINT:   LL = w_N * (N/25)^0.121
     */
    public BigDecimal calculateLiquidLimit(List<LlCasagrandePoint> points, TestMethod method) {
        if (points == null || points.isEmpty()) return null;

        if (method == TestMethod.ONE_POINT) {
            LlCasagrandePoint p = points.get(0);
            if (p.getWaterContentPct() == null) return null;
            double wN = p.getWaterContentPct().doubleValue();
            int N = p.getBlowCount();
            double ll = wN * Math.pow((double) N / 25.0, 0.121);
            return BigDecimal.valueOf(ll).setScale(SCALE, ROUNDING);
        }

        // MULTI_POINT: least-squares log-linear regression
        List<double[]> valid = points.stream()
                .filter(p -> p.getWaterContentPct() != null && p.getBlowCount() > 0)
                .map(p -> new double[]{Math.log10(p.getBlowCount()), p.getWaterContentPct().doubleValue()})
                .toList();

        if (valid.isEmpty()) return null;

        int n = valid.size();
        double sumX = 0, sumY = 0;
        for (double[] xy : valid) { sumX += xy[0]; sumY += xy[1]; }
        double xBar = sumX / n;
        double yBar = sumY / n;

        double[] AB = regressionCoefficients(valid, xBar, yBar);
        double A = AB[0];
        double B = AB[1];

        double ll = A * Math.log10(25.0) + B;
        return BigDecimal.valueOf(ll).setScale(SCALE, ROUNDING);
    }

    /**
     * Calculates R² for the log-linear regression on Casagrande points.
     * Returns null if fewer than 2 valid points.
     */
    public BigDecimal calculateRSquared(List<LlCasagrandePoint> points) {
        List<double[]> valid = points.stream()
                .filter(p -> p.getWaterContentPct() != null && p.getBlowCount() > 0)
                .map(p -> new double[]{Math.log10(p.getBlowCount()), p.getWaterContentPct().doubleValue()})
                .toList();

        if (valid.size() < 2) return null;

        int n = valid.size();
        double sumX = 0, sumY = 0;
        for (double[] xy : valid) { sumX += xy[0]; sumY += xy[1]; }
        double xBar = sumX / n;
        double yBar = sumY / n;

        double[] AB = regressionCoefficients(valid, xBar, yBar);
        double A = AB[0];
        double B = AB[1];

        double ssRes = 0, ssTot = 0;
        for (double[] xy : valid) {
            double yHat = A * xy[0] + B;
            ssRes += Math.pow(xy[1] - yHat, 2);
            ssTot += Math.pow(xy[1] - yBar, 2);
        }

        if (ssTot == 0) return BigDecimal.ONE.setScale(RSQUARED_SCALE, ROUNDING);
        double r2 = 1.0 - ssRes / ssTot;
        return BigDecimal.valueOf(r2).setScale(RSQUARED_SCALE, ROUNDING);
    }

    /**
     * Calculates Plastic Limit as the average water content of all PL determinations.
     */
    public BigDecimal calculatePlasticLimit(List<LlPlDetermination> determinations) {
        if (determinations == null || determinations.isEmpty()) return null;
        List<BigDecimal> values = determinations.stream()
                .filter(d -> d.getWaterContentPct() != null)
                .map(LlPlDetermination::getWaterContentPct)
                .toList();
        if (values.isEmpty()) return null;
        BigDecimal sum = values.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        return sum.divide(BigDecimal.valueOf(values.size()), SCALE, ROUNDING);
    }

    private double[] regressionCoefficients(List<double[]> points, double xBar, double yBar) {
        double ssxx = 0, ssxy = 0;
        for (double[] xy : points) {
            double dx = xy[0] - xBar;
            ssxx += dx * dx;
            ssxy += dx * (xy[1] - yBar);
        }
        double A = (ssxx == 0) ? 0 : ssxy / ssxx;
        double B = yBar - A * xBar;
        return new double[]{A, B};
    }
}
