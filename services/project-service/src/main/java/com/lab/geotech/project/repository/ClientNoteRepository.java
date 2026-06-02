package com.lab.geotech.project.repository;

import com.lab.geotech.project.entity.ClientNote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ClientNoteRepository extends JpaRepository<ClientNote, UUID> {
    List<ClientNote> findByProjectIdOrderByCreatedAtDesc(UUID projectId);
}
