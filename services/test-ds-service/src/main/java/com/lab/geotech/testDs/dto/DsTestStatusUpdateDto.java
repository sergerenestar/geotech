package com.lab.geotech.testDs.dto;

import com.lab.geotech.testDs.constant.TestStatus;
import jakarta.validation.constraints.NotNull;

public record DsTestStatusUpdateDto(
        @NotNull TestStatus status
) {}
