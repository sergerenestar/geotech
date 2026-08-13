package com.lab.geotech.project.repository;

import com.lab.geotech.project.entity.TestComment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TestCommentRepository extends JpaRepository<TestComment, UUID> {

    List<TestComment> findByProjectTestIdOrderByCreatedAtAsc(UUID projectTestId);
}
