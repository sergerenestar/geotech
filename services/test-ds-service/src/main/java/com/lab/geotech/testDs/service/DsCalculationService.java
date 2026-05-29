package com.lab.geotech.testDs.service;

import com.lab.geotech.testDs.dto.DsReadingInputDto;
import com.lab.geotech.testDs.dto.DsStageInputDto;
import com.lab.geotech.testDs.entity.DsReading;
import com.lab.geotech.testDs.entity.DsStage;
import com.lab.geotech.testDs.entity.DsTest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.util.List;

@Slf4j
@Service
public class DsCalculationService {

    private static final RoundingMode ROUNDING = RoundingMode.HALF_UP;
    private static final int STRESS_SCALE = 3;
    private static final int DISPLACEMENT_SCALE = 4;
    private static final BigDecimal EIGHT_PERCENT = new BigDecimal("8.0");
    private static final BigDecimal HUNDRED = new BigDecimal("100");

    /**
     * Calculates per-reading derived values (displacement_mm, shear_force_N, shear_stress_kPa)
     * using ASTM D-3080 formulas, then finds the peak shear stress for each stage.
     * Finally runs Mohr-Coulomb linear regression across all stages.
     */
    public void calculate(DsTest test, List<DsStageInputDto> stageInputs) {
        BigDecimal dialFactor = test.getDialFactorMmPerDiv();
        BigDecimal calFactor = test.getCalibrationFactorNPerDiv();
        BigDecimal boxArea = test.getBoxWidthMm().multiply(test.getBoxLengthMm()); // mm²
        BigDecimal specimenHeight = test.getSpecimenHeightMm();

        List<DsStage> stages = test.getStages();

        for (int i = 0; i < stages.size(); i++) {
            DsStage stage = stages.get(i);
            DsStageInputDto stageInput = stageInputs.get(i);
            calculateReadings(stage, stageInput.readings(), dialFactor, calFactor, boxArea);
            findPeakShearStress(stage, specimenHeight);
        }

        runMohrCoulombRegression(test);
    }

    private void calculateReadings(DsStage stage,
                                   List<DsReadingInputDto> readingInputs,
                                   BigDecimal dialFactor,
                                   BigDecimal calFactor,
                                   BigDecimal boxArea) {
        List<DsReading> readings = stage.getReadings();
        for (int i = 0; i < readings.size(); i++) {
            DsReading reading = readings.get(i);
            DsReadingInputDto input = readingInputs.get(i);

            // displacement_mm = displacementDiv × dialFactorMmPerDiv
            BigDecimal displacementMm = input.displacementDiv()
                    .multiply(dialFactor)
                    .setScale(DISPLACEMENT_SCALE, ROUNDING);

            // shear_force_N = provingRingDiv × calibrationFactorNPerDiv
            BigDecimal shearForceN = input.provingRingDiv()
                    .multiply(calFactor)
                    .setScale(DISPLACEMENT_SCALE, ROUNDING);

            // shear_stress_kPa = (shear_force_N / box_area_mm²) × 1000
            BigDecimal shearStressKpa = shearForceN
                    .divide(boxArea, 10, ROUNDING)
                    .multiply(HUNDRED.multiply(BigDecimal.TEN))
                    .setScale(STRESS_SCALE, ROUNDING);

            reading.setDisplacementMm(displacementMm);
            reading.setShearForceN(shearForceN);
            reading.setShearStressKpa(shearStressKpa);
        }
    }

    private void findPeakShearStress(DsStage stage, BigDecimal specimenHeight) {
        List<DsReading> readings = stage.getReadings();
        if (readings.isEmpty()) {
            return;
        }

        // Find index of maximum shear stress
        int peakIndex = 0;
        BigDecimal maxStress = readings.get(0).getShearStressKpa();
        for (int i = 1; i < readings.size(); i++) {
            BigDecimal stress = readings.get(i).getShearStressKpa();
            if (stress != null && (maxStress == null || stress.compareTo(maxStress) > 0)) {
                maxStress = stress;
                peakIndex = i;
            }
        }

        // Check if there's no clear peak: last reading has max stress
        boolean noClearPeak = (peakIndex == readings.size() - 1);

        if (noClearPeak && specimenHeight != null && specimenHeight.compareTo(BigDecimal.ZERO) > 0) {
            // Use stress at 8% shear strain
            BigDecimal peakAtEightPercent = findStressAt8PercentStrain(readings, specimenHeight);
            if (peakAtEightPercent != null) {
                stage.setPeakShearStressKpa(peakAtEightPercent.setScale(STRESS_SCALE, ROUNDING));
                // Find displacement at this stress value
                for (DsReading reading : readings) {
                    BigDecimal strain = computeShearStrain(reading.getDisplacementMm(), specimenHeight);
                    if (strain != null && strain.compareTo(EIGHT_PERCENT) >= 0) {
                        stage.setDisplacementAtPeakMm(reading.getDisplacementMm());
                        break;
                    }
                }
                return;
            }
        }

        // Standard peak
        DsReading peakReading = readings.get(peakIndex);
        stage.setPeakShearStressKpa(
                peakReading.getShearStressKpa() != null
                        ? peakReading.getShearStressKpa().setScale(STRESS_SCALE, ROUNDING)
                        : null
        );
        stage.setDisplacementAtPeakMm(
                peakReading.getDisplacementMm() != null
                        ? peakReading.getDisplacementMm().setScale(DISPLACEMENT_SCALE, ROUNDING)
                        : null
        );
    }

    private BigDecimal findStressAt8PercentStrain(List<DsReading> readings, BigDecimal specimenHeight) {
        for (DsReading reading : readings) {
            BigDecimal strain = computeShearStrain(reading.getDisplacementMm(), specimenHeight);
            if (strain != null && strain.compareTo(EIGHT_PERCENT) >= 0) {
                return reading.getShearStressKpa();
            }
        }
        // If no reading reaches 8%, return the last reading's stress
        DsReading last = readings.get(readings.size() - 1);
        return last.getShearStressKpa();
    }

    private BigDecimal computeShearStrain(BigDecimal displacementMm, BigDecimal specimenHeight) {
        if (displacementMm == null || specimenHeight == null || specimenHeight.compareTo(BigDecimal.ZERO) == 0) {
            return null;
        }
        // shear_strain (%) = displacement_mm / specimenHeightMm × 100
        return displacementMm.divide(specimenHeight, 10, ROUNDING).multiply(HUNDRED);
    }

    /**
     * Mohr-Coulomb linear regression across stages.
     * Requires at least 2 stages with non-null peakShearStressKpa.
     */
    public void runMohrCoulombRegression(DsTest test) {
        List<DsStage> stages = test.getStages();

        // Collect valid (σ, τ) pairs
        List<BigDecimal> sigmas = stages.stream()
                .filter(s -> s.getPeakShearStressKpa() != null)
                .map(DsStage::getNormalStressKpa)
                .toList();
        List<BigDecimal> taus = stages.stream()
                .filter(s -> s.getPeakShearStressKpa() != null)
                .map(DsStage::getPeakShearStressKpa)
                .toList();

        int n = sigmas.size();
        if (n < 2) {
            log.info("Skipping Mohr-Coulomb regression: only {} valid stage(s)", n);
            test.setCohesionKpa(null);
            test.setFrictionAngleDeg(null);
            test.setRSquared(null);
            return;
        }

        // Use double arithmetic for regression (precision sufficient for geotechnical calcs)
        double[] sigma = sigmas.stream().mapToDouble(BigDecimal::doubleValue).toArray();
        double[] tau = taus.stream().mapToDouble(BigDecimal::doubleValue).toArray();

        double sumSigma = 0, sumTau = 0, sumSigmaTau = 0, sumSigmaSq = 0;
        for (int i = 0; i < n; i++) {
            sumSigma += sigma[i];
            sumTau += tau[i];
            sumSigmaTau += sigma[i] * tau[i];
            sumSigmaSq += sigma[i] * sigma[i];
        }

        double denom = n * sumSigmaSq - sumSigma * sumSigma;
        if (Math.abs(denom) < 1e-10) {
            log.warn("Degenerate regression: all normal stresses are identical");
            test.setCohesionKpa(null);
            test.setFrictionAngleDeg(null);
            test.setRSquared(null);
            return;
        }

        // slope = tan(φ)
        double tanPhi = (n * sumSigmaTau - sumSigma * sumTau) / denom;
        // c = (Στ - tanφ · Σσ) / n
        double cohesion = (sumTau - tanPhi * sumSigma) / n;
        // φ_deg = atan(slope) × 180 / π
        double phiDeg = Math.toDegrees(Math.atan(tanPhi));

        // R²
        double tauMean = sumTau / n;
        double ssTot = 0, ssRes = 0;
        for (int i = 0; i < n; i++) {
            double tauHat = cohesion + tanPhi * sigma[i];
            ssRes += Math.pow(tau[i] - tauHat, 2);
            ssTot += Math.pow(tau[i] - tauMean, 2);
        }
        double rSquared = (ssTot < 1e-12) ? 1.0 : 1.0 - ssRes / ssTot;

        test.setCohesionKpa(BigDecimal.valueOf(cohesion).setScale(STRESS_SCALE, ROUNDING));
        test.setFrictionAngleDeg(BigDecimal.valueOf(phiDeg).setScale(STRESS_SCALE, ROUNDING));
        test.setRSquared(BigDecimal.valueOf(rSquared).setScale(6, ROUNDING));
    }
}
