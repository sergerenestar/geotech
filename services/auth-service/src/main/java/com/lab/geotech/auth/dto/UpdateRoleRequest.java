package com.lab.geotech.auth.dto;

import com.lab.geotech.auth.constant.Role;
import jakarta.validation.constraints.NotNull;

public record UpdateRoleRequest(
        @NotNull Role role
) {}
