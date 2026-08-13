package com.lab.geotech.testPs.service;

import com.lab.geotech.testPs.dto.HydrometerReadingInputDto;
import com.lab.geotech.testPs.dto.SieveResultInputDto;
import com.lab.geotech.testPs.entity.PsHydrometerReading;
import com.lab.geotech.testPs.entity.PsSieveResult;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class PsCalculationService {

    private static final int SCALE = 3;
    private static final RoundingMode ROUNDING = RoundingMode.HALF_UP;
    private static final MathContext MC = new MathContext(10, ROUNDING);

    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);
    private static final BigDecimal GRAVEL_BOUNDARY = new BigDecimal("4.75");
    private static final BigDecimal FINES_BOUNDARY = new BigDecimal("0.075");

    // Meniscus correction (standard)
    private static final double MENISCUS_CORRECTION = 0.5;
    // Correction factor for Gs=2.70 (ASTM D-422 Table 3)
    private static final double A_FACTOR_GS270 = 0.9748;

    // K factor table entries: {temp_C, K}
    private static final double[][] K_TABLE = {
            {15.0, 0.01364},
            {20.0, 0.01323},
            {25.0, 0.01288},
            {30.0, 0.01247}
    };

    /** Sieve calculation result records */
    public record PsFractions(BigDecimal pctGravel, BigDecimal pctSand, BigDecimal pctFines) {}
    public record PsDiameters(BigDecimal d10, BigDecimal d30, BigDecimal d60, BigDecimal cu, BigDecimal cc) {}
    public record PsUscsResult(String symbol, String name) {}

    /** A combined data point (sieve or hydrometer) for D-curve interpolation */
    public record GradationPoint(double openingMm, double pctFiner) {}

    // -----------------------------------------------------------------------
    // Sieve calculations
    // -----------------------------------------------------------------------

    /**
     * Calculates pct_retained and pct_finer for each sieve result.
     * Sieves are sorted descending by opening_mm before cumulating.
     */
    public List<PsSieveResult> calculateSieveResults(List<SieveResultInputDto> inputs,
                                                      BigDecimal totalDryMassG) {
        if (inputs == null || inputs.isEmpty()) return List.of();

        // Sort descending by opening (largest sieve first)
        List<SieveResultInputDto> sorted = inputs.stream()
                .sorted(Comparator.comparing(SieveResultInputDto::openingMm).reversed())
                .toList();

        List<PsSieveResult> results = new ArrayList<>();
        BigDecimal cumulativeRetained = BigDecimal.ZERO;

        for (SieveResultInputDto input : sorted) {
            BigDecimal pctRetained = input.massRetainedG()
                    .divide(totalDryMassG, SCALE, ROUNDING)
                    .multiply(HUNDRED);

            cumulativeRetained = cumulativeRetained.add(pctRetained);
            BigDecimal pctFiner = HUNDRED.subtract(cumulativeRetained).setScale(SCALE, ROUNDING);

            PsSieveResult result = new PsSieveResult();
            result.setSieveLabel(input.sieveLabel());
            result.setOpeningMm(input.openingMm());
            result.setMassRetainedG(input.massRetainedG());
            result.setPctRetained(pctRetained.setScale(SCALE, ROUNDING));
            result.setPctFiner(pctFiner);
            results.add(result);
        }
        return results;
    }

    /**
     * Calculates soil fraction percentages from sieve results.
     * pct_gravel = 100 - pct_finer at largest sieve >= 4.75mm
     * pct_fines  = pct_finer at 0.075mm (No.200)
     * pct_sand   = 100 - pct_gravel - pct_fines
     */
    public PsFractions calculateFractions(List<PsSieveResult> sieveResults) {
        if (sieveResults == null || sieveResults.isEmpty()) {
            return new PsFractions(null, null, null);
        }

        // Find pct_finer at 4.75mm boundary (gravel/sand boundary)
        BigDecimal pctFinerAtGravel = findPctFinerAt(sieveResults, GRAVEL_BOUNDARY);
        // Find pct_finer at 0.075mm boundary (sand/fines boundary)
        BigDecimal pctFinerAtFines = findPctFinerAt(sieveResults, FINES_BOUNDARY);

        BigDecimal pctGravel = null;
        BigDecimal pctFines = null;
        BigDecimal pctSand = null;

        if (pctFinerAtGravel != null) {
            pctGravel = HUNDRED.subtract(pctFinerAtGravel).setScale(SCALE, ROUNDING);
            if (pctGravel.compareTo(BigDecimal.ZERO) < 0) pctGravel = BigDecimal.ZERO.setScale(SCALE, ROUNDING);
        }

        if (pctFinerAtFines != null) {
            pctFines = pctFinerAtFines.setScale(SCALE, ROUNDING);
            if (pctFines.compareTo(BigDecimal.ZERO) < 0) pctFines = BigDecimal.ZERO.setScale(SCALE, ROUNDING);
        }

        if (pctGravel != null && pctFines != null) {
            pctSand = HUNDRED.subtract(pctGravel).subtract(pctFines).setScale(SCALE, ROUNDING);
            if (pctSand.compareTo(BigDecimal.ZERO) < 0) pctSand = BigDecimal.ZERO.setScale(SCALE, ROUNDING);
        }

        return new PsFractions(pctGravel, pctSand, pctFines);
    }

    /**
     * Find the pct_finer value at the given boundary opening_mm.
     * Uses the sieve result at exactly that opening, or the closest sieve just at or below.
     */
    private BigDecimal findPctFinerAt(List<PsSieveResult> sieveResults, BigDecimal boundaryMm) {
        // Try exact match first
        for (PsSieveResult r : sieveResults) {
            if (r.getOpeningMm().compareTo(boundaryMm) == 0) {
                return r.getPctFiner();
            }
        }
        // Find the largest sieve opening >= boundary (i.e., the sieve just above or at the boundary)
        // For gravel boundary (4.75mm): use pct_finer at 4.75mm sieve
        // If not present, use the nearest sieve opening >= 4.75 (most conservative)
        PsSieveResult nearest = null;
        BigDecimal nearestDiff = null;
        for (PsSieveResult r : sieveResults) {
            BigDecimal diff = r.getOpeningMm().subtract(boundaryMm).abs();
            if (nearestDiff == null || diff.compareTo(nearestDiff) < 0) {
                nearestDiff = diff;
                nearest = r;
            }
        }
        return nearest != null ? nearest.getPctFiner() : null;
    }

    // -----------------------------------------------------------------------
    // Hydrometer calculations
    // -----------------------------------------------------------------------

    /**
     * Calculates corrected_reading, particle_diameter_mm, and pct_finer
     * for each hydrometer reading using simplified Stokes law.
     */
    public List<PsHydrometerReading> calculateHydrometerReadings(List<HydrometerReadingInputDto> inputs,
                                                                   BigDecimal totalDryMassG,
                                                                   BigDecimal specificGravity) {
        if (inputs == null || inputs.isEmpty()) return List.of();

        double totalMass = totalDryMassG.doubleValue();
        // Use a factor based on Gs; for simplicity use table value for Gs=2.70
        // For other Gs, ASTM provides correction; we use 0.9748 as default
        double aFactor = A_FACTOR_GS270;

        List<PsHydrometerReading> results = new ArrayList<>();

        for (HydrometerReadingInputDto input : inputs) {
            double tempC = input.temperatureC().doubleValue();
            double rActual = input.hydrometerReading().doubleValue();
            double elapsedMin = input.elapsedTimeMin().doubleValue();

            // Temperature correction: +0.4 per °C above 20, -0.4 per °C below
            double ct = (tempC - 20.0) * 0.4;

            // Corrected reading (includes meniscus correction of 0.5)
            double rCorrected = rActual + ct + MENISCUS_CORRECTION;

            // Effective depth L (simplified empirical formula)
            double l = 16.3 - 0.164 * rCorrected;
            if (l < 0) l = 0.1; // guard against negative depth

            // K factor interpolated from table
            double k = interpolateK(tempC);

            // Elapsed time in minutes; particle diameter D = K * sqrt(L / t)
            double t = elapsedMin;
            double particleDiameter = 0.0;
            if (t > 0) {
                particleDiameter = k * Math.sqrt(l / t);
            }

            // pct_finer = (a * corrected_reading / total_dry_mass_g) * 100
            double pctFiner = (aFactor * rCorrected / totalMass) * 100.0;

            PsHydrometerReading reading = new PsHydrometerReading();
            reading.setReadingNumber(input.readingNumber());
            reading.setElapsedTimeMin(input.elapsedTimeMin());
            reading.setHydrometerReading(input.hydrometerReading());
            reading.setTemperatureC(input.temperatureC());
            reading.setCorrectedReading(BigDecimal.valueOf(rCorrected).setScale(3, ROUNDING));
            reading.setParticleDiameterMm(BigDecimal.valueOf(particleDiameter).setScale(8, ROUNDING));
            reading.setPctFiner(BigDecimal.valueOf(pctFiner).setScale(3, ROUNDING));
            results.add(reading);
        }
        return results;
    }

    /**
     * Interpolates K factor linearly between temperature table entries.
     */
    private double interpolateK(double tempC) {
        if (tempC <= K_TABLE[0][0]) return K_TABLE[0][1];
        if (tempC >= K_TABLE[K_TABLE.length - 1][0]) return K_TABLE[K_TABLE.length - 1][1];

        for (int i = 0; i < K_TABLE.length - 1; i++) {
            double t0 = K_TABLE[i][0];
            double t1 = K_TABLE[i + 1][0];
            if (tempC >= t0 && tempC <= t1) {
                double fraction = (tempC - t0) / (t1 - t0);
                return K_TABLE[i][1] + fraction * (K_TABLE[i + 1][1] - K_TABLE[i][1]);
            }
        }
        return K_TABLE[0][1];
    }

    // -----------------------------------------------------------------------
    // Characteristic diameters and coefficients
    // -----------------------------------------------------------------------

    /**
     * Calculates D10, D30, D60, Cu, Cc from all gradation points
     * (sieve + hydrometer combined, sorted by opening_mm descending).
     * Uses log-linear interpolation.
     */
    public PsDiameters calculateCharacteristicDiameters(List<GradationPoint> allPoints) {
        if (allPoints == null || allPoints.size() < 2) {
            return new PsDiameters(null, null, null, null, null);
        }

        // Sort by openingMm descending (largest first = highest pct_finer, since large sieves pass more material)
        List<GradationPoint> sorted = allPoints.stream()
                .filter(p -> p.openingMm() > 0 && p.pctFiner() >= 0)
                .sorted(Comparator.comparingDouble(GradationPoint::openingMm).reversed())
                .toList();

        if (sorted.size() < 2) {
            return new PsDiameters(null, null, null, null, null);
        }

        BigDecimal d10 = interpolateDiameter(sorted, 10.0);
        BigDecimal d30 = interpolateDiameter(sorted, 30.0);
        BigDecimal d60 = interpolateDiameter(sorted, 60.0);

        BigDecimal cu = null;
        BigDecimal cc = null;

        if (d10 != null && d60 != null && d10.compareTo(BigDecimal.ZERO) > 0) {
            cu = d60.divide(d10, 4, ROUNDING);
        }
        if (d10 != null && d30 != null && d60 != null
                && d10.compareTo(BigDecimal.ZERO) > 0 && d60.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal d30sq = d30.multiply(d30, MC);
            BigDecimal denom = d10.multiply(d60, MC);
            cc = d30sq.divide(denom, 4, ROUNDING);
        }

        return new PsDiameters(d10, d30, d60, cu, cc);
    }

    /**
     * Log-linear interpolation to find diameter at a given pct_finer percentage x%.
     * Points are sorted descending by openingMm, so pctFiner also decreases from first to last.
     * p0 (larger opening) has higher pctFiner; p1 (smaller opening) has lower pctFiner.
     */
    private BigDecimal interpolateDiameter(List<GradationPoint> points, double targetPct) {
        // Walk list: openingMm descending → pctFiner descending.
        // Find adjacent pair where pctFiner straddles targetPct:
        //   p0.pctFiner >= targetPct > p1.pctFiner
        GradationPoint above = null; // larger opening, pctFiner >= target
        GradationPoint below = null; // smaller opening, pctFiner <= target

        for (int i = 0; i < points.size() - 1; i++) {
            GradationPoint p0 = points.get(i);      // larger opening, higher pctFiner
            GradationPoint p1 = points.get(i + 1);  // smaller opening, lower pctFiner

            if (p0.pctFiner() >= targetPct && p1.pctFiner() <= targetPct) {
                above = p0;
                below = p1;
                break;
            }
        }

        if (above == null || below == null) return null;

        // Guard against identical pctFiner values
        double pRange = above.pctFiner() - below.pctFiner();
        if (Math.abs(pRange) < 1e-9) return BigDecimal.valueOf(above.openingMm()).setScale(6, ROUNDING);

        // Log-linear interpolation between above (larger D, higher %) and below (smaller D, lower %):
        // D_x = 10^( log10(D_above) + (targetPct - P_above)/(P_below - P_above) * (log10(D_below) - log10(D_above)) )
        double logDAbove = Math.log10(above.openingMm());
        double logDBelow = Math.log10(below.openingMm());
        double fraction = (targetPct - above.pctFiner()) / (below.pctFiner() - above.pctFiner());
        double logD = logDAbove + fraction * (logDBelow - logDAbove);
        double d = Math.pow(10.0, logD);

        return BigDecimal.valueOf(d).setScale(6, ROUNDING);
    }

    // -----------------------------------------------------------------------
    // USCS Classification
    // -----------------------------------------------------------------------

    /**
     * Simplified USCS classification based on fraction percentages and Cu/Cc.
     * Full classification (GC, SM, etc.) requires LL/PI from ll-service.
     */
    public PsUscsResult classifyUscs(BigDecimal pctGravel, BigDecimal pctSand, BigDecimal pctFines,
                                      BigDecimal cu, BigDecimal cc) {
        if (pctGravel == null || pctSand == null || pctFines == null) {
            return new PsUscsResult(null, null);
        }

        double gravel = pctGravel.doubleValue();
        double sand = pctSand.doubleValue();
        double fines = pctFines.doubleValue();

        // Coarse fraction = 100 - fines
        double coarse = 100.0 - fines;

        // Base symbol: G if gravel > 50% of coarse fraction, else S
        boolean isGravel = coarse > 0 && (gravel / coarse) > 0.5;
        String base = isGravel ? "G" : "S";

        if (fines < 5.0) {
            // Well-graded or poorly graded
            boolean wellGraded = cuAndCcOk(isGravel, cu, cc);
            if (wellGraded) {
                String symbol = base + "W";
                String name = isGravel ? "Well-Graded Gravel" : "Well-Graded Sand";
                return new PsUscsResult(symbol, name);
            } else {
                String symbol = base + "P";
                String name = isGravel ? "Poorly-Graded Gravel" : "Poorly-Graded Sand";
                return new PsUscsResult(symbol, name);
            }
        } else if (fines > 12.0) {
            // Needs LL/PI from plasticity data — mark as pending
            String symbol = base + "-F";
            String name = (isGravel ? "Gravel" : "Sand") + " with Fines (plasticity data required)";
            return new PsUscsResult(symbol, name);
        } else {
            // Borderline 5-12%: dual symbol based on Cu/Cc
            boolean wellGraded = cuAndCcOk(isGravel, cu, cc);
            String wOrP = wellGraded ? "W" : "P";
            // Second part is always M (pending LL) for simplicity
            String symbol = base + wOrP + "-" + base + "M";
            String name = (isGravel ? "Gravel" : "Sand") + " with Silt (borderline classification)";
            return new PsUscsResult(symbol, name);
        }
    }

    private boolean cuAndCcOk(boolean isGravel, BigDecimal cu, BigDecimal cc) {
        if (cu == null || cc == null) return false;
        double cuVal = cu.doubleValue();
        double ccVal = cc.doubleValue();
        double cuThreshold = isGravel ? 4.0 : 6.0;
        return cuVal >= cuThreshold && ccVal >= 1.0 && ccVal <= 3.0;
    }

    // -----------------------------------------------------------------------
    // Combined gradation point builder
    // -----------------------------------------------------------------------

    /**
     * Builds combined list of gradation points from sieve results and hydrometer readings.
     */
    public List<GradationPoint> buildGradationPoints(List<PsSieveResult> sieveResults,
                                                      List<PsHydrometerReading> hydrometerReadings) {
        List<GradationPoint> points = new ArrayList<>();

        if (sieveResults != null) {
            for (PsSieveResult s : sieveResults) {
                if (s.getPctFiner() != null && s.getOpeningMm() != null) {
                    points.add(new GradationPoint(
                            s.getOpeningMm().doubleValue(),
                            s.getPctFiner().doubleValue()
                    ));
                }
            }
        }

        if (hydrometerReadings != null) {
            for (PsHydrometerReading h : hydrometerReadings) {
                if (h.getParticleDiameterMm() != null && h.getPctFiner() != null
                        && h.getParticleDiameterMm().compareTo(BigDecimal.ZERO) > 0) {
                    points.add(new GradationPoint(
                            h.getParticleDiameterMm().doubleValue(),
                            h.getPctFiner().doubleValue()
                    ));
                }
            }
        }

        return points;
    }
}
