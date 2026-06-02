package com.lab.geotech.project.dto;

import jakarta.validation.constraints.NotBlank;

public record ClientNoteCreateDto(@NotBlank String content, @NotBlank String author) {}
