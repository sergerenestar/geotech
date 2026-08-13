package com.lab.geotech.aiAssistant.service;

import com.lab.geotech.aiAssistant.dto.WcValidationRequest;
import com.lab.geotech.aiAssistant.dto.WcValidationResponse;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

/**
 * Phase 1 AI anomaly detection for water-content test results.
 *
 * <p>This is a deterministic rule engine, not a machine learning model. It runs synchronously
 * inside the test-wc-service save path (called before persisting the result). Flags are stored
 * in the {@code ai_flags} JSONB column and surfaced to the lab manager for advisory review.
 * The lab manager always has final authority — flags are never blocking.
 *
 * <p>Rules implemented (ASTM D-2216 physical bounds):
 * <ol>
 *   <li>ERROR — Any determination has a dry soil mass ≤ 0 g (physically impossible; indicates
 *       a data entry error or reversed container/wet mass values).</li>
 *   <li>ERROR — Average water content &lt; 0% (physically impossible).</li>
 *   <li>ERROR — Average water content > 300% (extremely high; likely a decimal-point error,
 *       though organic soils like peat can legitimately exceed 200%).</li>
 *   <li>WARNING — Average water content > 100% (uncommon; possible for organic or volcanic
 *       soils — flag for manual verification).</li>
 * </ol>
 *
 * <p>Phase 2 (Sprint 8+) will replace or augment this with a RAG assistant using Qdrant +
 * Claude API ({@code claude-sonnet-4-6}) + LangGraph for context-aware anomaly detection.
 */
@Service
public class WcAnomalyRuleService {

    private static final BigDecimal ZERO = BigDecimal.ZERO;
    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);
    private static final BigDecimal THREE_HUNDRED = BigDecimal.valueOf(300);

    /**
     * Validates a water-content test result against the rule set.
     *
     * <p>Returns the first rule violation encountered (rules are evaluated in priority order:
     * per-determination checks before aggregate checks). Returns {@code "NONE"} if all rules pass.
     *
     * @param req The test data to validate (determinations and computed average).
     * @return A validation response with severity ("NONE", "WARNING", or "ERROR") and a
     *         human-readable French-language message for the lab manager.
     */
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
