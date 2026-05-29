package com.lab.geotech.testProctor.service;

import com.lab.geotech.testProctor.dto.ProctorPointInputDto;
import com.lab.geotech.testProctor.entity.ProctorPoint;
import com.lab.geotech.testProctor.entity.ProctorTest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.util.List;

/**
 * ASTM D-698 (Standard Proctor) / ASTM D-1557 (Modified Proctor) calculations.
 *
 * <p>Unit weight formulas:
 * <pre>
 *   γt (kN/m³) = ((M_mold_soil - M_mold) / V_mold) × 9.81
 *   where masses are in grams and volume in cm³ (1 g/cm³ = 9.81 kN/m³)
 *
 *   γd (kN/m³) = γt / (1 + w / 100)
 * </pre>
 *
 * <p>Curve fit: second-order polynomial   γd = a·w² + b·w + c   (least squares)
 * <pre>
 *   OMC    = -b / (2a)
 *   γd_max = c - b² / (4a)
 *   R²     computed for the polynomial fit
 * </pre>
 */
@Service
public class ProctorCalculationService {

    private static final int SCALE = 3;
    private static final int R2_SCALE = 6;
    private static final RoundingMode ROUNDING = RoundingMode.HALF_UP;

    // 1 g/cm³ = 9.81 kN/m³
    private static final double G_FACTOR = 9.81;

    /**
     * Compute wet and dry unit weights for a single compaction point and return
     * a populated ProctorPoint (proctorTest link not yet set).
     */
    public ProctorPoint calculatePoint(ProctorPointInputDto dto, int pointNumber,
                                       BigDecimal moldMassG, BigDecimal moldVolumeCm3) {
        double mSoil = dto.massMoldSoilG().subtract(moldMassG).doubleValue();
        double vMold = moldVolumeCm3.doubleValue();
        double w = dto.waterContentPct().doubleValue();

        // γt = (M_soil / V_mold) × 9.81
        double gammaT = (mSoil / vMold) * G_FACTOR;
        // γd = γt / (1 + w/100)
        double gammaD = gammaT / (1.0 + w / 100.0);

        ProctorPoint point = new ProctorPoint();
        point.setPointNumber(pointNumber);
        point.setMassMoldSoilG(dto.massMoldSoilG().setScale(SCALE, ROUNDING));
        point.setWaterContentPct(dto.waterContentPct().setScale(SCALE, ROUNDING));
        point.setWetUnitWeightKnM3(BigDecimal.valueOf(gammaT).setScale(SCALE, ROUNDING));
        point.setDryUnitWeightKnM3(BigDecimal.valueOf(gammaD).setScale(SCALE, ROUNDING));
        return point;
    }

    /**
     * Fit second-order polynomial to (water_content, dry_unit_weight) pairs.
     * Requires at least 3 points; returns null array elements if fit cannot be computed.
     *
     * @return double[] { omc, gdMax, rSquared } — all may be NaN if underdetermined
     */
    public double[] fitPolynomial(List<ProctorPoint> points) {
        if (points == null || points.size() < 3) {
            return new double[]{Double.NaN, Double.NaN, Double.NaN};
        }

        int n = points.size();
        // x = water content, y = dry unit weight
        double[] x = new double[n];
        double[] y = new double[n];
        for (int i = 0; i < n; i++) {
            x[i] = points.get(i).getWaterContentPct().doubleValue();
            y[i] = points.get(i).getDryUnitWeightKnM3().doubleValue();
        }

        // Build normal equations for  [a, b, c]  minimising sum((a*xi²+b*xi+c - yi)²)
        // Sums: s0=n, s1=Σxi, s2=Σxi², s3=Σxi³, s4=Σxi⁴
        double s0 = n, s1 = 0, s2 = 0, s3 = 0, s4 = 0;
        double t0 = 0, t1 = 0, t2 = 0; // Σyi, Σxi*yi, Σxi²*yi
        for (int i = 0; i < n; i++) {
            double xi = x[i], xi2 = xi * xi, yi = y[i];
            s1 += xi;
            s2 += xi2;
            s3 += xi2 * xi;
            s4 += xi2 * xi2;
            t0 += yi;
            t1 += xi * yi;
            t2 += xi2 * yi;
        }

        // 3×3 linear system  M * [a,b,c]^T = rhs  (using Cramer / Gaussian elimination)
        double[][] M = {
                {s4, s3, s2},
                {s3, s2, s1},
                {s2, s1, s0}
        };
        double[] rhs = {t2, t1, t0};

        double[] coeff = gaussianElimination(M, rhs);
        if (coeff == null) {
            return new double[]{Double.NaN, Double.NaN, Double.NaN};
        }

        double a = coeff[0], b = coeff[1], c = coeff[2];

        // Parabola opens downward (a < 0) for a valid compaction curve
        if (a >= 0) {
            return new double[]{Double.NaN, Double.NaN, Double.NaN};
        }

        double omc = -b / (2.0 * a);
        double gdMax = c - (b * b) / (4.0 * a);

        // R² for the polynomial fit
        double yBar = t0 / n;
        double ssRes = 0, ssTot = 0;
        for (int i = 0; i < n; i++) {
            double yHat = a * x[i] * x[i] + b * x[i] + c;
            ssRes += Math.pow(y[i] - yHat, 2);
            ssTot += Math.pow(y[i] - yBar, 2);
        }
        double r2 = (ssTot == 0) ? 1.0 : 1.0 - ssRes / ssTot;

        return new double[]{omc, gdMax, r2};
    }

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    /** Simple 3×3 Gaussian elimination with partial pivoting. Returns null if singular. */
    private double[] gaussianElimination(double[][] A, double[] b) {
        int n = b.length;
        // Augmented matrix
        double[][] aug = new double[n][n + 1];
        for (int i = 0; i < n; i++) {
            System.arraycopy(A[i], 0, aug[i], 0, n);
            aug[i][n] = b[i];
        }

        for (int col = 0; col < n; col++) {
            // Partial pivot
            int pivot = col;
            for (int row = col + 1; row < n; row++) {
                if (Math.abs(aug[row][col]) > Math.abs(aug[pivot][col])) {
                    pivot = row;
                }
            }
            double[] tmp = aug[col];
            aug[col] = aug[pivot];
            aug[pivot] = tmp;

            if (Math.abs(aug[col][col]) < 1e-12) return null; // singular

            double diag = aug[col][col];
            for (int j = col; j <= n; j++) aug[col][j] /= diag;

            for (int row = 0; row < n; row++) {
                if (row == col) continue;
                double factor = aug[row][col];
                for (int j = col; j <= n; j++) {
                    aug[row][j] -= factor * aug[col][j];
                }
            }
        }

        double[] result = new double[n];
        for (int i = 0; i < n; i++) result[i] = aug[i][n];
        return result;
    }

    /** Convert a primitive double to BigDecimal with SCALE=3, or null if NaN/Infinite. */
    public BigDecimal toBigDecimal3(double value) {
        if (Double.isNaN(value) || Double.isInfinite(value)) return null;
        return BigDecimal.valueOf(value).setScale(SCALE, ROUNDING);
    }

    /** Convert a primitive double to BigDecimal with R2_SCALE=6, or null if NaN/Infinite. */
    public BigDecimal toBigDecimalR2(double value) {
        if (Double.isNaN(value) || Double.isInfinite(value)) return null;
        return BigDecimal.valueOf(value).setScale(R2_SCALE, ROUNDING);
    }
}
