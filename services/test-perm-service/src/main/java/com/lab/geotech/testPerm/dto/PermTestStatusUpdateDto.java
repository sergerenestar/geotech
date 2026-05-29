package com.lab.geotech.testPerm.dto;

import com.lab.geotech.testPerm.constant.TestStatus;
import jakarta.validation.constraints.NotNull;

public record PermTestStatusUpdateDto(
        @NotNull TestStatus status
) {}
