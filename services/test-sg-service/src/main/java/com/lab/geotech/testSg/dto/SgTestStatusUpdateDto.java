package com.lab.geotech.testSg.dto;

import com.lab.geotech.testSg.constant.TestStatus;
import jakarta.validation.constraints.NotNull;

public record SgTestStatusUpdateDto(@NotNull TestStatus status) {}
