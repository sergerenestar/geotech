package com.lab.geotech.aiAssistant.controller;

import com.lab.geotech.aiAssistant.dto.WcValidationRequest;
import com.lab.geotech.aiAssistant.dto.WcValidationResponse;
import com.lab.geotech.aiAssistant.service.WcAnomalyRuleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiValidationController {

    private final WcAnomalyRuleService wcAnomalyRuleService;

    @PostMapping("/validate/water-content")
    public ResponseEntity<WcValidationResponse> validateWc(@Valid @RequestBody WcValidationRequest req) {
        return ResponseEntity.ok(wcAnomalyRuleService.validate(req));
    }
}
