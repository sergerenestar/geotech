package com.lab.geotech.testWc.service;

import com.lab.geotech.testWc.constant.AiFlag;
import com.lab.geotech.testWc.entity.WcDetermination;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class WcAnomalyService {

    private static final BigDecimal ZERO = BigDecimal.ZERO;
    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);
    private static final BigDecimal THREE_HUNDRED = BigDecimal.valueOf(300);

    public record AnomalyResult(AiFlag flag, String message) {}

    public AnomalyResult analyze(List<WcDetermination> determinations, BigDecimal averageWc) {
        for (WcDetermination d : determinations) {
            if (d.getMassDrySoilG() != null && d.getMassDrySoilG().compareTo(ZERO) <= 0) {
                return new AnomalyResult(AiFlag.ERROR,
                        "Determination #" + d.getDeterminationNumber() + ": dry soil mass ≤ 0 — invalid measurement");
            }
        }

        if (averageWc != null) {
            if (averageWc.compareTo(ZERO) < 0) {
                return new AnomalyResult(AiFlag.ERROR,
                        "Water content is negative (" + averageWc + "%) — check mass inputs");
            }
            if (averageWc.compareTo(THREE_HUNDRED) > 0) {
                return new AnomalyResult(AiFlag.ERROR,
                        "Water content exceeds 300% (" + averageWc + "%) — possible organic material or measurement error");
            }
            if (averageWc.compareTo(HUNDRED) > 0) {
                return new AnomalyResult(AiFlag.WARNING,
                        "Water content exceeds 100% (" + averageWc + "%) — verify sample is not highly organic");
            }
        }

        return new AnomalyResult(AiFlag.NONE, null);
    }
}
