package com.lab.geotech.auth.dto;

import com.lab.geotech.auth.constant.Role;
import com.lab.geotech.auth.constant.UserStatus;
import com.lab.geotech.auth.entity.User;

import java.time.OffsetDateTime;
import java.util.UUID;

public record UserResponse(
        UUID id,
        String email,
        String firstName,
        String lastName,
        String contactNumber,
        Role role,
        UserStatus status,
        String language,
        OffsetDateTime createdAt
) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getContactNumber(),
                user.getRole(),
                user.getStatus(),
                user.getLanguage(),
                user.getCreatedAt()
        );
    }
}
