package com.lab.geotech.testPs.dto;

import com.lab.geotech.testPs.constant.TestStatus;
import jakarta.validation.constraints.NotNull;

public record PsTestStatusUpdateDto(@NotNull TestStatus status) {}
