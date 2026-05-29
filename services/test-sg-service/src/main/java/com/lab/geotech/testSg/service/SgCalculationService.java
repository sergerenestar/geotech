package com.lab.geotech.testSg.service;

import com.lab.geotech.testSg.dto.SgDeterminationInputDto;
import com.lab.geotech.testSg.entity.SgDetermination;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.util.Map;
import java.util.NavigableMap;
import java.util.TreeMap;

/**
 * ASTM D-854 specific gravity calculation service.
 * Computes temperature correction factor K via linear interpolation
 * from the ASTM D-854 Table 1 lookup, then derives Gs_T and Gs_20 per determination.
 */
@Service
public class SgCalculationService {

    private static final MathContext MC = new MathContext(10, RoundingMode.HALF_UP);
    private static final int GS_SCALE = 4;
    private static final int K_SCALE = 6;

    /** ASTM D-854 Table 1: temperature (°C) → K correction factor */
    private static final NavigableMap<BigDecimal, BigDecimal> K_TABLE = new TreeMap<>();

    static {
        K_TABLE.put(BigDecimal.valueOf(15), new BigDecimal("0.9986"));
        K_TABLE.put(BigDecimal.valueOf(16), new BigDecimal("0.9989"));
        K_TABLE.put(BigDecimal.valueOf(17), new BigDecimal("0.9992"));
        K_TABLE.put(BigDecimal.valueOf(18), new BigDecimal("0.9994"));
        K_TABLE.put(BigDecimal.valueOf(19), new BigDecimal("0.9997"));
        K_TABLE.put(BigDecimal.valueOf(20), new BigDecimal("1.0000"));
        K_TABLE.put(BigDecimal.valueOf(21), new BigDecimal("1.0003"));
        K_TABLE.put(BigDecimal.valueOf(22), new BigDecimal("1.0006"));
        K_TABLE.put(BigDecimal.valueOf(23), new BigDecimal("1.0009"));
        K_TABLE.put(BigDecimal.valueOf(24), new BigDecimal("1.0012"));
        K_TABLE.put(BigDecimal.valueOf(25), new BigDecimal("1.0016"));
        K_TABLE.put(BigDecimal.valueOf(26), new BigDecimal("1.0019"));
        K_TABLE.put(BigDecimal.valueOf(27), new BigDecimal("1.0023"));
        K_TABLE.put(BigDecimal.valueOf(28), new BigDecimal("1.0026"));
        K_TABLE.put(BigDecimal.valueOf(29), new BigDecimal("1.0030"));
        K_TABLE.put(BigDecimal.valueOf(30), new BigDecimal("1.0034"));
    }

    /**
     * Result of K-factor lookup — carries the factor and whether the temperature
     * was outside the table range (triggers WARNING in anomaly service).
     */
    public record KResult(BigDecimal k, boolean outOfRange) {}

    /**
     * Looks up K from ASTM D-854 Table 1 with linear interpolation.
     * Temperatures below 15°C or above 30°C are clamped to the boundary value
     * and marked as out-of-range.
     */
    public KResult lookupK(BigDecimal temperatureC) {
        BigDecimal minKey = K_TABLE.firstKey(); // 15
        BigDecimal maxKey = K_TABLE.lastKey();  // 30

        if (temperatureC.compareTo(minKey) <= 0) {
            return new KResult(K_TABLE.get(minKey), temperatureC.compareTo(minKey) < 0);
        }
        if (temperatureC.compareTo(maxKey) >= 0) {
            return new KResult(K_TABLE.get(maxKey), temperatureC.compareTo(maxKey) > 0);
        }

        // Linear interpolation between floor and ceiling entries
        Map.Entry<BigDecimal, BigDecimal> lo = K_TABLE.floorEntry(temperatureC);
        Map.Entry<BigDecimal, BigDecimal> hi = K_TABLE.ceilingEntry(temperatureC);

        if (lo.getKey().compareTo(hi.getKey()) == 0) {
            // Exact match
            return new KResult(lo.getValue(), false);
        }

        // k = k_lo + (T - T_lo) / (T_hi - T_lo) * (k_hi - k_lo)
        BigDecimal tRange = hi.getKey().subtract(lo.getKey());
        BigDecimal kRange = hi.getValue().subtract(lo.getValue());
        BigDecimal fraction = temperatureC.subtract(lo.getKey()).divide(tRange, MC);
        BigDecimal k = lo.getValue().add(fraction.multiply(kRange, MC));

        return new KResult(k.setScale(K_SCALE, RoundingMode.HALF_UP), false);
    }

    /**
     * Calculates a single SgDetermination entity from the input DTO.
     * The returned entity does NOT have its sgTest reference set (caller must set it).
     *
     * <pre>
     * Gs_T  = M_s / (M_s + M_fw - M_fsw)
     * Gs_20 = Gs_T × K
     * </pre>
     */
    public SgDetermination calculateDetermination(SgDeterminationInputDto dto, int determinationNumber) {
        BigDecimal ms   = dto.massDrySoilG();
        BigDecimal mfw  = dto.massFlaskWaterG();
        BigDecimal mfsw = dto.massFlaskSoilWaterG();
        BigDecimal temp = dto.temperatureC();

        // Gs_T = Ms / (Ms + Mfw - Mfsw)
        BigDecimal denominator = ms.add(mfw).subtract(mfsw);
        BigDecimal gsAtTemp = ms.divide(denominator, MC).setScale(GS_SCALE, RoundingMode.HALF_UP);

        // K correction factor
        KResult kr = lookupK(temp);
        BigDecimal k = kr.k().setScale(K_SCALE, RoundingMode.HALF_UP);

        // Gs_20 = Gs_T × K
        BigDecimal gs20 = gsAtTemp.multiply(k, MC).setScale(GS_SCALE, RoundingMode.HALF_UP);

        return SgDetermination.builder()
                .determinationNumber(determinationNumber)
                .flaskNumber(dto.flaskNumber())
                .massDrySoilG(ms)
                .massFlaskWaterG(mfw)
                .massFlaskSoilWaterG(mfsw)
                .temperatureC(temp)
                .gsAtTemp(gsAtTemp)
                .kFactor(k)
                .gs20(gs20)
                .build();
    }
}
