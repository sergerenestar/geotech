package com.lab.geotech.aiAssistant.service;

import com.lab.geotech.aiAssistant.dto.WcValidationRequest;
import com.lab.geotech.aiAssistant.dto.WcValidationResponse;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class WcAnomalyRuleService {

    private static final BigDecimal ZERO = BigDecimal.ZERO;
    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);
    private static final BigDecimal THREE_HUNDRED = BigDecimal.valueOf(300);

    public WcValidationResponse validate(WcValidationRequest req) {
        for (WcValidationRequest.DeterminationData d : req.determinations()) {
            if (d.massDrySoilG() != null && d.massDrySoilG().compareTo(ZERO) <= 0) {
                return new WcValidationResponse(req.testId(), "ERROR",
                        "Détermination #" + d.determinationNumber() + ": masse sol sec ≤ 0 — mesure invalide");
            }
        }

        BigDecimal avg = req.averageWaterContentPct();
        if (avg != null) {
            if (avg.compareTo(ZERO) < 0) {
                return new WcValidationResponse(req.testId(), "ERROR",
                        "Teneur en eau négative (" + avg + "%) — vérifier les masses saisies");
            }
            if (avg.compareTo(THREE_HUNDRED) > 0) {
                return new WcValidationResponse(req.testId(), "ERROR",
                        "Teneur en eau > 300% (" + avg + "%) — matériau organique ou erreur de mesure");
            }
            if (avg.compareTo(HUNDRED) > 0) {
                return new WcValidationResponse(req.testId(), "WARNING",
                        "Teneur en eau > 100% (" + avg + "%) — vérifier si matériau organique");
            }
        }

        return new WcValidationResponse(req.testId(), "NONE", null);
    }
}
