package com.lab.geotech.aiAssistant.dto;

import java.util.UUID;

public record WcValidationResponse(
        UUID testId,
        String aiFlag,
        String aiFlagMessage
) {}
