package com.lab.geotech.auth.repository;

import com.lab.geotech.auth.entity.AdminNote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AdminNoteRepository extends JpaRepository<AdminNote, UUID> {
    List<AdminNote> findAllByUserIdOrderByCreatedAtDesc(UUID userId);
    Optional<AdminNote> findByIdAndAuthorId(UUID id, UUID authorId);
}
