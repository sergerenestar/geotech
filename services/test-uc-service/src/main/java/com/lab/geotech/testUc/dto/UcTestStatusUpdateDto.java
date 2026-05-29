package com.lab.geotech.testUc.dto;

import com.lab.geotech.testUc.constant.TestStatus;
import jakarta.validation.constraints.NotNull;

public record UcTestStatusUpdateDto(
        @NotNull TestStatus status
) {}
