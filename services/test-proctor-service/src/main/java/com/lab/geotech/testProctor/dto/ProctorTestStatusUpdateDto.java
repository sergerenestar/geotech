package com.lab.geotech.testProctor.dto;

import com.lab.geotech.testProctor.constant.TestStatus;
import jakarta.validation.constraints.NotNull;

public record ProctorTestStatusUpdateDto(@NotNull TestStatus status) {}
