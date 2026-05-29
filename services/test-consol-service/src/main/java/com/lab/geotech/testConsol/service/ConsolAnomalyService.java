package com.lab.geotech.testConsol.service;

import com.lab.geotech.testConsol.constant.AiFlag;
import com.lab.geotech.testConsol.constant.LoadType;
import com.lab.geotech.testConsol.entity.ConsolStage;
import com.lab.geotech.testConsol.entity.ConsolTest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
public class ConsolAnomalyService {

    private static final BigDecimal CC_THRESHOLD = new BigDecimal("0.7");

    public void analyze(ConsolTest test) {
        List<String> warnings = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        // If Cc > 0.7 -> WARNING
        if (test.getCc() != null && test.getCc().compareTo(CC_THRESHOLD) > 0) {
            warnings.add("Sol très compressible (Cc > 0.7)");
        }

        // If any stage has eFinal < 0 -> ERROR
        boolean negativeVoidRatio = test.getStages().stream()
                .anyMatch(s -> s.getEFinal() != null && s.getEFinal().compareTo(BigDecimal.ZERO) < 0);
        if (negativeVoidRatio) {
            errors.add("Indice des vides négatif détecté");
        }

        // If sigmaPKpa < first loading stage sigma -> WARNING
        List<ConsolStage> loadingStages = test.getStages().stream()
                .filter(s -> s.getLoadType() == LoadType.LOADING)
                .toList();
        if (test.getSigmaPKpa() != null && !loadingStages.isEmpty()) {
            BigDecimal firstLoadingSigma = loadingStages.get(0).getSigmaVKpa();
            if (test.getSigmaPKpa().compareTo(firstLoadingSigma) < 0) {
                warnings.add("Contrainte de préconsolidation inférieure à la charge initiale");
            }
        }

        // If any stage cvM2Yr < 0 -> WARNING
        boolean negativeCv = test.getStages().stream()
                .anyMatch(s -> s.getCvM2Yr() != null && s.getCvM2Yr().compareTo(BigDecimal.ZERO) < 0);
        if (negativeCv) {
            warnings.add("cv négatif détecté — vérifier les lectures");
        }

        if (!errors.isEmpty()) {
            test.setAiFlag(AiFlag.ERROR);
            test.setAiFlagMessage(String.join("; ", errors));
        } else if (!warnings.isEmpty()) {
            test.setAiFlag(AiFlag.WARNING);
            test.setAiFlagMessage(String.join("; ", warnings));
        } else {
            test.setAiFlag(AiFlag.NONE);
            test.setAiFlagMessage(null);
        }
    }
}
