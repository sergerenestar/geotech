package com.lab.geotech.project.repository;

import com.lab.geotech.project.entity.TestStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TestStatusHistoryRepository extends JpaRepository<TestStatusHistory, UUID> {

    List<TestStatusHistory> findByProjectTestIdOrderByChangedAtAsc(UUID projectTestId);
}
