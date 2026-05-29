package com.lab.geotech.testWc.service;

import com.lab.geotech.testWc.dto.WcDeterminationInputDto;
import com.lab.geotech.testWc.entity.WcDetermination;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
public class WcCalculationService {

    private static final int SCALE = 3;
    private static final RoundingMode ROUNDING = RoundingMode.HALF_UP;

    public WcDetermination calculate(WcDeterminationInputDto dto, int determinationNumber) {
        BigDecimal massWater = dto.massContainerWetSoilG().subtract(dto.massContainerDrySoilG());
        BigDecimal massDry = dto.massContainerDrySoilG().subtract(dto.massContainerG());

        BigDecimal waterContentPct = null;
        if (massDry.compareTo(BigDecimal.ZERO) != 0) {
            waterContentPct = massWater.divide(massDry, SCALE, ROUNDING)
                    .multiply(BigDecimal.valueOf(100));
        }

        WcDetermination det = new WcDetermination();
        det.setDeterminationNumber(determinationNumber);
        det.setMassContainerG(dto.massContainerG());
        det.setMassContainerWetSoilG(dto.massContainerWetSoilG());
        det.setMassContainerDrySoilG(dto.massContainerDrySoilG());
        det.setMassWaterG(massWater.setScale(SCALE, ROUNDING));
        det.setMassDrySoilG(massDry.setScale(SCALE, ROUNDING));
        det.setWaterContentPct(waterContentPct);
        return det;
    }

    public BigDecimal averageWaterContent(List<WcDetermination> determinations) {
        List<BigDecimal> values = determinations.stream()
                .filter(d -> d.getWaterContentPct() != null)
                .map(WcDetermination::getWaterContentPct)
                .toList();
        if (values.isEmpty()) return null;
        BigDecimal sum = values.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        return sum.divide(BigDecimal.valueOf(values.size()), SCALE, ROUNDING);
    }
}
