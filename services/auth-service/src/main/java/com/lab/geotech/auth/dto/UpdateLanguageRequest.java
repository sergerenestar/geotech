package com.lab.geotech.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record UpdateLanguageRequest(
        @NotBlank @Pattern(regexp = "^(fr|en)$") String language
) {}
