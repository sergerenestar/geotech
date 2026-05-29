package com.lab.geotech.auth.repository;

import com.lab.geotech.auth.constant.Role;
import com.lab.geotech.auth.constant.UserStatus;
import com.lab.geotech.auth.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    Page<User> findAllByStatus(UserStatus status, Pageable pageable);
    Page<User> findAllByRole(Role role, Pageable pageable);
    Page<User> findAllByRoleAndStatus(Role role, UserStatus status, Pageable pageable);
    boolean existsByEmail(String email);
}
