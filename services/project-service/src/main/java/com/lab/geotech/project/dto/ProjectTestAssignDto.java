package com.lab.geotech.project.dto;

import java.util.UUID;

public record ProjectTestAssignDto(UUID technicianId, String priority, String deadline) {}
