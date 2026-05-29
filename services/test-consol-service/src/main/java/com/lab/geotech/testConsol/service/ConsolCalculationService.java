package com.lab.geotech.testConsol.service;

import com.lab.geotech.testConsol.constant.DrainageType;
import com.lab.geotech.testConsol.constant.LoadType;
import com.lab.geotech.testConsol.dto.ConsolStageInputDto;
import com.lab.geotech.testConsol.entity.ConsolReading;
import com.lab.geotech.testConsol.entity.ConsolStage;
import com.lab.geotech.testConsol.entity.ConsolTest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@Slf4j
public class ConsolCalculationService {

    private static final RoundingMode ROUNDING = RoundingMode.HALF_UP;

    public void calculate(ConsolTest test, List<ConsolStageInputDto> stageInputs) {
        List<ConsolStage> stages = test.getStages();
        BigDecimal ePrev = test.getInitialVoidRatio();
        BigDecimal hPrev = test.getInitialHeightMm();

        for (int i = 0; i < stages.size(); i++) {
            ConsolStage stage = stages.get(i);
            ConsolStageInputDto input = stageInputs.get(i);

            // 1. Compute settlement per reading (settlement = first_dial - current_dial)
            List<ConsolReading> readings = stage.getReadings();
            if (!readings.isEmpty()) {
                BigDecimal firstDial = readings.get(0).getDialReadingMm();
                for (ConsolReading r : readings) {
                    r.setSettlementMm(firstDial.subtract(r.getDialReadingMm()).setScale(4, ROUNDING));
                }
            }

            // 2. Total settlement for stage = last settlement value
            BigDecimal deltaH = BigDecimal.ZERO;
            if (!readings.isEmpty()) {
                BigDecimal lastSettlement = readings.get(readings.size() - 1).getSettlementMm();
                if (lastSettlement != null) deltaH = lastSettlement;
            }

            // 3. Void ratio: e_final = e_prev - (deltaH / H_prev) * (1 + e_prev)
            BigDecimal eFinal = null;
            if (hPrev.compareTo(BigDecimal.ZERO) > 0) {
                eFinal = ePrev.subtract(
                        deltaH.divide(hPrev, 10, ROUNDING).multiply(BigDecimal.ONE.add(ePrev))
                ).setScale(4, ROUNDING);
                stage.setEFinal(eFinal);
            }

            // 4. Hdr for cv computation
            BigDecimal hFinal = hPrev.subtract(deltaH);
            BigDecimal hAvg = hPrev.add(hFinal).divide(BigDecimal.TWO, 6, ROUNDING); // mm
            BigDecimal hdrMm = (test.getDrainageType() == DrainageType.DOUBLE)
                    ? hAvg.divide(BigDecimal.TWO, 6, ROUNDING)
                    : hAvg;
            BigDecimal hdrM = hdrMm.divide(BigDecimal.valueOf(1000), 8, ROUNDING); // convert mm -> m

            // 5. cv from Casagrande log-t method
            BigDecimal t50 = findT50(readings);
            if (t50 != null && t50.compareTo(BigDecimal.ZERO) > 0) {
                stage.setT50Min(t50.setScale(4, ROUNDING));
                // cv = 0.197 * Hdr^2 / t50  [m^2/min] -> convert to m^2/year (* 525960)
                BigDecimal cvM2Min = BigDecimal.valueOf(0.197)
                        .multiply(hdrM.multiply(hdrM))
                        .divide(t50, 12, ROUNDING);
                stage.setCvM2Yr(cvM2Min.multiply(BigDecimal.valueOf(525960)).setScale(6, ROUNDING));
            }

            // 6. mv = -Δe / ((1 + e_avg) * Δσ')
            // Only meaningful for LOADING stages with a previous stage to compare to
            if (i > 0 && stage.getLoadType() == LoadType.LOADING) {
                ConsolStage prevStage = stages.get(i - 1);
                BigDecimal ePrevVal = prevStage.getEFinal() != null ? prevStage.getEFinal() : test.getInitialVoidRatio();
                BigDecimal eAvg = eFinal != null ? ePrevVal.add(eFinal).divide(BigDecimal.TWO, 6, ROUNDING) : ePrevVal;
                BigDecimal deltaSigma = stage.getSigmaVKpa().subtract(prevStage.getSigmaVKpa());
                if (eFinal != null && deltaSigma.compareTo(BigDecimal.ZERO) > 0) {
                    BigDecimal deltaE = ePrevVal.subtract(eFinal); // compression = positive
                    BigDecimal mv = deltaE.divide(
                            BigDecimal.ONE.add(eAvg).multiply(deltaSigma), 10, ROUNDING);
                    stage.setMvM2Kn(mv.setScale(8, ROUNDING));
                }
            }

            // Update prev for next iteration
            if (eFinal != null) ePrev = eFinal;
            hPrev = hFinal.max(BigDecimal.ONE); // guard against zero
        }

        // 7. Compute Cc and Cs from e-log(σ') regression
        computeCcCs(test);
        // 8. Estimate preconsolidation pressure
        computeSigmaP(test);
    }

    private BigDecimal findT50(List<ConsolReading> readings) {
        // Casagrande log-t method: find t50 by linear interpolation
        if (readings.size() < 3) return null;
        // Use first two suitable readings for d0 back-extrapolation
        BigDecimal d0;
        ConsolReading r0 = readings.get(0);
        ConsolReading r1 = readings.get(1);
        if (r0.getSettlementMm() == null || r1.getSettlementMm() == null) return null;
        // d0 = 2*settlement(t1) - settlement(t2) approximation
        d0 = BigDecimal.TWO.multiply(r0.getSettlementMm()).subtract(r1.getSettlementMm());
        // d100 ≈ last reading's settlement
        BigDecimal d100 = readings.get(readings.size() - 1).getSettlementMm();
        if (d100 == null) return null;
        BigDecimal d50 = d0.add(d100).divide(BigDecimal.TWO, 6, ROUNDING);
        // Find t50 by interpolation
        for (int i = 1; i < readings.size(); i++) {
            ConsolReading prev = readings.get(i - 1);
            ConsolReading curr = readings.get(i);
            if (prev.getSettlementMm() == null || curr.getSettlementMm() == null) continue;
            if (prev.getSettlementMm().compareTo(d50) <= 0 && curr.getSettlementMm().compareTo(d50) >= 0
                    || prev.getSettlementMm().compareTo(d50) >= 0 && curr.getSettlementMm().compareTo(d50) <= 0) {
                // Linear interpolation
                BigDecimal ds = curr.getSettlementMm().subtract(prev.getSettlementMm());
                if (ds.abs().compareTo(BigDecimal.valueOf(0.0001)) < 0) return prev.getTimeMin();
                BigDecimal frac = d50.subtract(prev.getSettlementMm()).divide(ds, 8, ROUNDING);
                BigDecimal dt = curr.getTimeMin().subtract(prev.getTimeMin());
                return prev.getTimeMin().add(frac.multiply(dt)).setScale(4, ROUNDING);
            }
        }
        return null;
    }

    private void computeCcCs(ConsolTest test) {
        List<ConsolStage> loadingStages = test.getStages().stream()
                .filter(s -> s.getLoadType() == LoadType.LOADING && s.getEFinal() != null
                        && s.getSigmaVKpa().compareTo(BigDecimal.ZERO) > 0)
                .toList();
        List<ConsolStage> unloadingStages = test.getStages().stream()
                .filter(s -> (s.getLoadType() == LoadType.UNLOADING || s.getLoadType() == LoadType.RELOADING)
                        && s.getEFinal() != null && s.getSigmaVKpa().compareTo(BigDecimal.ZERO) > 0)
                .toList();

        test.setCc(computeSlope(loadingStages));
        test.setCs(computeSlope(unloadingStages));
    }

    private BigDecimal computeSlope(List<ConsolStage> stages) {
        if (stages.size() < 2) return null;
        // Linear regression: e vs log10(σ'); slope = -Cc or -Cs
        double[] x = stages.stream().mapToDouble(s -> Math.log10(s.getSigmaVKpa().doubleValue())).toArray();
        double[] y = stages.stream().mapToDouble(s -> s.getEFinal().doubleValue()).toArray();
        int n = x.length;
        double sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        for (int i = 0; i < n; i++) { sumX += x[i]; sumY += y[i]; sumXY += x[i] * y[i]; sumX2 += x[i] * x[i]; }
        double denom = n * sumX2 - sumX * sumX;
        if (Math.abs(denom) < 1e-10) return null;
        double slope = (n * sumXY - sumX * sumY) / denom;
        return BigDecimal.valueOf(-slope).setScale(4, ROUNDING); // Cc is positive (e decreases as σ increases)
    }

    private void computeSigmaP(ConsolTest test) {
        List<ConsolStage> loadingStages = test.getStages().stream()
                .filter(s -> s.getLoadType() == LoadType.LOADING && s.getEFinal() != null
                        && s.getSigmaVKpa().compareTo(BigDecimal.ZERO) > 0)
                .toList();
        if (loadingStages.size() < 3) return;
        // Simplified Casagrande: find stage of maximum curvature in e-log(σ') curve
        double[] logSigma = loadingStages.stream().mapToDouble(s -> Math.log10(s.getSigmaVKpa().doubleValue())).toArray();
        double[] e = loadingStages.stream().mapToDouble(s -> s.getEFinal().doubleValue()).toArray();
        int n = loadingStages.size();
        int maxCurvIdx = 1;
        double maxCurv = 0;
        for (int i = 1; i < n - 1; i++) {
            double d2 = Math.abs((e[i + 1] - 2 * e[i] + e[i - 1]) / Math.pow((logSigma[i + 1] - logSigma[i - 1]) / 2, 2));
            if (d2 > maxCurv) { maxCurv = d2; maxCurvIdx = i; }
        }
        test.setSigmaPKpa(loadingStages.get(maxCurvIdx).getSigmaVKpa().setScale(3, ROUNDING));
    }
}
