package com.lab.geotech.testUc.service;

import com.lab.geotech.testUc.dto.UcReadingInputDto;
import com.lab.geotech.testUc.entity.UcReading;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.util.List;

/**
 * Performs ASTM D-2166 Unconfined Compression calculations.
 */
@Service
public class UcCalculationService {

    private static final int SCALE_INTERMEDIATE = 4;
    private static final int SCALE_STRESS = 3;
    private static final RoundingMode ROUNDING = RoundingMode.HALF_UP;

    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);
    private static final BigDecimal TEN = BigDecimal.valueOf(10);
    private static final BigDecimal FIFTEEN = BigDecimal.valueOf(15);

    /**
     * Calculates all derived fields for a single reading.
     *
     * @param dto              raw input (deformationDiv, provingRingDiv)
     * @param readingNumber    1-based index of the reading
     * @param h0Mm             initial height in mm
     * @param a0Cm2            initial cross-sectional area in cm²
     * @param dialFactor       dial gauge factor (mm per division)
     * @param calibFactor      calibration factor (N per division)
     * @return populated UcReading (test_id not yet set)
     */
    public UcReading calculateReading(UcReadingInputDto dto,
                                      int readingNumber,
                                      BigDecimal h0Mm,
                                      BigDecimal a0Cm2,
                                      BigDecimal dialFactor,
                                      BigDecimal calibFactor) {

        // deformation_mm = deformationDiv × dialGaugeFactorMmPerDiv
        BigDecimal deformationMm = dto.deformationDiv()
                .multiply(dialFactor)
                .setScale(SCALE_INTERMEDIATE, ROUNDING);

        // load_N = provingRingDiv × calibrationFactorNPerDiv
        BigDecimal loadN = dto.provingRingDiv()
                .multiply(calibFactor)
                .setScale(SCALE_INTERMEDIATE, ROUNDING);

        // strain_pct = (deformation_mm / H0_mm) × 100
        BigDecimal strainPct = BigDecimal.ZERO;
        if (h0Mm.compareTo(BigDecimal.ZERO) != 0) {
            strainPct = deformationMm
                    .divide(h0Mm, SCALE_INTERMEDIATE, ROUNDING)
                    .multiply(HUNDRED)
                    .setScale(SCALE_INTERMEDIATE, ROUNDING);
        }

        // A_corrected = A0 / (1 - strain_pct/100)
        BigDecimal strainDecimal = strainPct.divide(HUNDRED, SCALE_INTERMEDIATE + 2, ROUNDING);
        BigDecimal denominator = BigDecimal.ONE.subtract(strainDecimal);
        BigDecimal correctedAreaCm2 = BigDecimal.ZERO;
        if (denominator.compareTo(BigDecimal.ZERO) != 0) {
            correctedAreaCm2 = a0Cm2
                    .divide(denominator, SCALE_INTERMEDIATE, ROUNDING);
        }

        // stress_kPa = load_N / (A_corrected × 10)
        // (A in cm², load in N → kPa = N / (cm² × 10) = N/10 / cm² → kN/m²)
        BigDecimal stressKpa = BigDecimal.ZERO;
        if (correctedAreaCm2.compareTo(BigDecimal.ZERO) != 0) {
            stressKpa = loadN
                    .divide(correctedAreaCm2.multiply(TEN), SCALE_STRESS, ROUNDING);
        }

        UcReading reading = new UcReading();
        reading.setReadingNumber(readingNumber);
        reading.setDeformationDiv(dto.deformationDiv());
        reading.setProvingRingDiv(dto.provingRingDiv());
        reading.setDeformationMm(deformationMm);
        reading.setLoadN(loadN);
        reading.setStrainPct(strainPct);
        reading.setCorrectedAreaCm2(correctedAreaCm2);
        reading.setStressKpa(stressKpa);
        return reading;
    }

    /**
     * Computes A0 (initial cross-sectional area) in cm².
     * A0 = π × (d0_cm)² / 4,  where d0_cm = d0_mm / 10
     */
    public BigDecimal computeA0Cm2(BigDecimal initialDiameterMm) {
        double d0Cm = initialDiameterMm.doubleValue() / 10.0;
        double a0 = Math.PI * Math.pow(d0Cm, 2) / 4.0;
        return BigDecimal.valueOf(a0).setScale(SCALE_INTERMEDIATE, ROUNDING);
    }

    /**
     * Peak detection per ASTM D-2166.
     * Returns [qu_kPa, failure_strain_pct] from the list of computed readings.
     *
     * If all readings are monotonically increasing (no clear peak) and max strain >= 15%,
     * take stress at 15% strain (interpolated). Otherwise take absolute max.
     */
    public BigDecimal[] detectPeak(List<UcReading> readings) {
        if (readings == null || readings.isEmpty()) {
            return new BigDecimal[]{BigDecimal.ZERO, BigDecimal.ZERO};
        }

        // Find index and value of maximum stress
        int peakIdx = 0;
        BigDecimal maxStress = readings.get(0).getStressKpa();
        for (int i = 1; i < readings.size(); i++) {
            BigDecimal s = readings.get(i).getStressKpa();
            if (s != null && s.compareTo(maxStress) > 0) {
                maxStress = s;
                peakIdx = i;
            }
        }

        BigDecimal maxStrain = readings.get(readings.size() - 1).getStrainPct();

        // If the peak is at the last reading (no clear peak) and max strain >= 15%,
        // use stress at 15% strain per ASTM.
        if (peakIdx == readings.size() - 1 && maxStrain != null
                && maxStrain.compareTo(FIFTEEN) >= 0) {
            // Find stress at 15% strain by linear interpolation
            BigDecimal stressAt15 = stressAtStrain(readings, FIFTEEN);
            BigDecimal strainAt15 = FIFTEEN;
            return new BigDecimal[]{
                    stressAt15.setScale(SCALE_STRESS, ROUNDING),
                    strainAt15.setScale(SCALE_STRESS, ROUNDING)
            };
        }

        BigDecimal failureStrain = readings.get(peakIdx).getStrainPct();
        return new BigDecimal[]{
                maxStress.setScale(SCALE_STRESS, ROUNDING),
                (failureStrain != null ? failureStrain : BigDecimal.ZERO).setScale(SCALE_STRESS, ROUNDING)
        };
    }

    /**
     * Linearly interpolates the stress at a target strain value from the readings list.
     */
    private BigDecimal stressAtStrain(List<UcReading> readings, BigDecimal targetStrain) {
        // Find two bracketing readings
        for (int i = 0; i < readings.size() - 1; i++) {
            BigDecimal s1 = readings.get(i).getStrainPct();
            BigDecimal s2 = readings.get(i + 1).getStrainPct();
            if (s1 == null || s2 == null) continue;
            if (s1.compareTo(targetStrain) <= 0 && s2.compareTo(targetStrain) >= 0) {
                BigDecimal stress1 = readings.get(i).getStressKpa();
                BigDecimal stress2 = readings.get(i + 1).getStressKpa();
                if (stress1 == null || stress2 == null) return BigDecimal.ZERO;
                BigDecimal dStrain = s2.subtract(s1);
                if (dStrain.compareTo(BigDecimal.ZERO) == 0) return stress1;
                BigDecimal t = targetStrain.subtract(s1).divide(dStrain, SCALE_INTERMEDIATE + 2, ROUNDING);
                return stress1.add(t.multiply(stress2.subtract(stress1)))
                        .setScale(SCALE_STRESS, ROUNDING);
            }
        }
        // If target is beyond all readings, return last reading's stress
        UcReading last = readings.get(readings.size() - 1);
        return last.getStressKpa() != null ? last.getStressKpa() : BigDecimal.ZERO;
    }
}
