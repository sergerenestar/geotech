package com.lab.geotech.testCbr.service;

import com.lab.geotech.testCbr.dto.CbrIntensityInputDto;
import com.lab.geotech.testCbr.dto.PenetrationInputDto;
import com.lab.geotech.testCbr.dto.SwellingInputDto;
import com.lab.geotech.testCbr.entity.CbrIntensity;
import com.lab.geotech.testCbr.entity.CbrPenetration;
import com.lab.geotech.testCbr.entity.CbrSwelling;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.util.List;

@Service
public class CbrCalculationService {

    // Standard CBR load references (NF P94-078 / ASTM D-1883)
    private static final BigDecimal STD_LOAD_25MM_KN = new BigDecimal("13.24");
    private static final BigDecimal STD_LOAD_50MM_KN = new BigDecimal("19.96");
    private static final BigDecimal DEFAULT_RING_COEFF = new BigDecimal("0.318");
    private static final BigDecimal MOLD_HEIGHT_MM = new BigDecimal("127.0");

    /**
     * Build a CbrIntensity entity from input DTO.
     * Calculates:
     *  - water_content_pct (if masses provided and not already given)
     *  - dry_density_tm3 (if masses provided and not already given)
     *  - compaction_degree_pct (if proctor reference given)
     *  - cbr_25mm and cbr_50mm (from penetration curve, if not directly provided)
     *  - cbr_index = max(cbr_25mm, cbr_50mm)
     *  - load_kn for each penetration reading (ring_reading × ring_coefficient)
     */
    public CbrIntensity buildIntensity(CbrIntensityInputDto dto, BigDecimal ringCoeff,
                                       BigDecimal proctorGdmaxTm3, BigDecimal moldVolCm3) {
        BigDecimal rc = ringCoeff != null ? ringCoeff : DEFAULT_RING_COEFF;

        BigDecimal waterContent = dto.waterContentPct();
        BigDecimal dryDensity = dto.dryDensityTm3();

        // Derive water content if masses are available
        if (waterContent == null && dto.massWetG() != null && dto.massDryG() != null
                && dto.massMoldG() != null) {
            BigDecimal wetSoil = dto.massWetG().subtract(dto.massMoldG());
            BigDecimal drySoil = dto.massDryG().subtract(dto.massMoldG());
            if (drySoil.compareTo(BigDecimal.ZERO) > 0) {
                waterContent = wetSoil.subtract(drySoil)
                        .divide(drySoil, 4, RoundingMode.HALF_UP)
                        .multiply(new BigDecimal("100"))
                        .setScale(2, RoundingMode.HALF_UP);
            }
        }

        // Derive dry density from dry soil mass + mold volume
        if (dryDensity == null && dto.massDryG() != null && dto.massMoldG() != null
                && moldVolCm3 != null && moldVolCm3.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal drySoilG = dto.massDryG().subtract(dto.massMoldG());
            // γd (g/cm³ = T/m³) = drySoilG / moldVolCm3
            dryDensity = drySoilG.divide(moldVolCm3, 4, RoundingMode.HALF_UP);
        }

        // Compaction degree
        BigDecimal compDegree = dto.compactionDegreePct();
        if (compDegree == null && dryDensity != null && proctorGdmaxTm3 != null
                && proctorGdmaxTm3.compareTo(BigDecimal.ZERO) > 0) {
            compDegree = dryDensity.divide(proctorGdmaxTm3, 4, RoundingMode.HALF_UP)
                    .multiply(new BigDecimal("100"))
                    .setScale(2, RoundingMode.HALF_UP);
        }

        CbrIntensity intensity = CbrIntensity.builder()
                .blows(dto.blows())
                .massMoldG(dto.massMoldG())
                .massWetG(dto.massWetG())
                .massDryG(dto.massDryG())
                .waterContentPct(waterContent)
                .dryDensityTm3(dryDensity)
                .compactionDegreePct(compDegree)
                .cbr25mm(dto.cbr25mm())
                .cbr50mm(dto.cbr50mm())
                .build();

        // Build penetration readings and compute load_kn
        if (dto.penetrationReadings() != null) {
            for (PenetrationInputDto pr : dto.penetrationReadings()) {
                BigDecimal loadKn = pr.loadKn();
                if (loadKn == null && pr.ringReading() != null) {
                    loadKn = pr.ringReading().multiply(rc).setScale(3, RoundingMode.HALF_UP);
                }
                CbrPenetration pen = CbrPenetration.builder()
                        .intensity(intensity)
                        .penetrationMm(pr.penetrationMm())
                        .ringReading(pr.ringReading())
                        .loadKn(loadKn)
                        .build();
                intensity.getPenetrationReadings().add(pen);
            }

            // Derive CBR indices from penetration curve if not provided
            if (intensity.getCbr25mm() == null) {
                intensity.setCbr25mm(interpolateLoadAt(intensity.getPenetrationReadings(),
                        new BigDecimal("2.5"), STD_LOAD_25MM_KN));
            }
            if (intensity.getCbr50mm() == null) {
                intensity.setCbr50mm(interpolateLoadAt(intensity.getPenetrationReadings(),
                        new BigDecimal("5.0"), STD_LOAD_50MM_KN));
            }
        }

        // CBR index = max(2.5mm, 5mm)
        BigDecimal cbr25 = intensity.getCbr25mm();
        BigDecimal cbr50 = intensity.getCbr50mm();
        if (cbr25 != null && cbr50 != null) {
            intensity.setCbrIndex(cbr25.max(cbr50));
        } else if (cbr25 != null) {
            intensity.setCbrIndex(cbr25);
        } else if (cbr50 != null) {
            intensity.setCbrIndex(cbr50);
        }

        // Build swelling readings
        if (dto.swellingReadings() != null) {
            for (SwellingInputDto sw : dto.swellingReadings()) {
                BigDecimal swPct = sw.swellingPct();
                if (swPct == null && sw.readingMm() != null) {
                    swPct = sw.readingMm()
                            .divide(MOLD_HEIGHT_MM, 5, RoundingMode.HALF_UP)
                            .multiply(new BigDecimal("100"))
                            .setScale(3, RoundingMode.HALF_UP);
                }
                CbrSwelling swelling = CbrSwelling.builder()
                        .intensity(intensity)
                        .hours(sw.hours())
                        .readingMm(sw.readingMm())
                        .swellingPct(swPct)
                        .build();
                intensity.getSwellingReadings().add(swelling);
            }
        }

        return intensity;
    }

    /**
     * Linear interpolation from penetration curve to find load at target penetration,
     * then compute CBR = (load / standardLoad) × 100.
     */
    private BigDecimal interpolateLoadAt(List<CbrPenetration> readings,
                                          BigDecimal targetMm, BigDecimal standardKn) {
        if (readings == null || readings.isEmpty()) return null;

        CbrPenetration below = null;
        CbrPenetration above = null;
        for (CbrPenetration r : readings) {
            if (r.getPenetrationMm().compareTo(targetMm) <= 0) below = r;
            if (r.getPenetrationMm().compareTo(targetMm) >= 0 && above == null) above = r;
        }
        if (below == null || above == null || below.getLoadKn() == null || above.getLoadKn() == null) {
            return null;
        }

        BigDecimal load;
        if (below.getPenetrationMm().compareTo(above.getPenetrationMm()) == 0) {
            load = below.getLoadKn();
        } else {
            BigDecimal range = above.getPenetrationMm().subtract(below.getPenetrationMm());
            BigDecimal t = targetMm.subtract(below.getPenetrationMm())
                    .divide(range, 6, RoundingMode.HALF_UP);
            load = below.getLoadKn().add(
                    above.getLoadKn().subtract(below.getLoadKn()).multiply(t));
        }

        return load.divide(standardKn, 4, RoundingMode.HALF_UP)
                .multiply(new BigDecimal("100"))
                .setScale(2, RoundingMode.HALF_UP);
    }
}
