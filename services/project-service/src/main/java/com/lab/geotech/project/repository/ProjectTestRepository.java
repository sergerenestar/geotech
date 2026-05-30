package com.lab.geotech.project.repository;

import com.lab.geotech.project.constant.TestType;
import com.lab.geotech.project.entity.ProjectTest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProjectTestRepository extends JpaRepository<ProjectTest, UUID> {

    List<ProjectTest> findByProjectId(UUID projectId);

    Optional<ProjectTest> findByProjectIdAndTestType(UUID projectId, TestType testType);

    void deleteByProjectId(UUID projectId);

    void deleteByProjectIdAndTestType(UUID projectId, TestType testType);
}
