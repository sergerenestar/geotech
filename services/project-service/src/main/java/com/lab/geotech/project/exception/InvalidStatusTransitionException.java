package com.lab.geotech.project.exception;

import com.lab.geotech.project.constant.ProjectStatus;

public class InvalidStatusTransitionException extends RuntimeException {
    public InvalidStatusTransitionException(ProjectStatus from, ProjectStatus to) {
        super("Invalid status transition: " + from + " → " + to);
    }
}
