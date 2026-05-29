package com.lab.geotech.testConsol.dto;

import com.lab.geotech.testConsol.constant.TestStatus;
import jakarta.validation.constraints.NotNull;

public record ConsolTestStatusUpdateDto(
        @NotNull TestStatus status
) {}
