package com.lab.geotech.project.dto;

import com.lab.geotech.project.constant.ProjectStatus;
import jakarta.validation.constraints.NotNull;

public record ProjectStatusUpdateDto(@NotNull ProjectStatus status) {}
