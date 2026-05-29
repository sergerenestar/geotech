package com.lab.geotech.testWc.dto;

import com.lab.geotech.testWc.constant.TestStatus;
import jakarta.validation.constraints.NotNull;

public record WcTestStatusUpdateDto(@NotNull TestStatus status) {}
