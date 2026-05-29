package com.lab.geotech.testCbr.dto;

import com.lab.geotech.testCbr.constant.TestStatus;
import jakarta.validation.constraints.NotNull;

public record CbrStatusUpdateDto(@NotNull TestStatus status) {}
