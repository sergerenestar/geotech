package com.lab.geotech.project.repository;

import com.lab.geotech.project.entity.Project;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;
import java.util.UUID;

public interface ProjectRepository extends JpaRepository<Project, UUID> {
    Page<Project> findAllByCreatedBy(UUID createdBy, Pageable pageable);

    @Query("SELECT p.projectCode FROM Project p WHERE p.projectCode LIKE :prefix ORDER BY p.projectCode DESC LIMIT 1")
    Optional<String> findLastCodeByPrefix(String prefix);
}
