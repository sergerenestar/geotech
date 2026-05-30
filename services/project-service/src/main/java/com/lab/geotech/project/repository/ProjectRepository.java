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

    // Native query bypasses @Where(is_deleted=false) so soft-deleted codes are never reused
    @Query(value = "SELECT project_code FROM projects.projects WHERE project_code LIKE :prefix ORDER BY project_code DESC LIMIT 1", nativeQuery = true)
    Optional<String> findLastCodeByPrefix(String prefix);
}
