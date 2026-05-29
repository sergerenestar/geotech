package com.lab.geotech.testLl.dto;

import com.lab.geotech.testLl.constant.TestStatus;
import jakarta.validation.constraints.NotNull;

public record LlTestStatusUpdateDto(@NotNull TestStatus status) {}
