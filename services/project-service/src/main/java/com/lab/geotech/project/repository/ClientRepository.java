package com.lab.geotech.project.repository;

import com.lab.geotech.project.entity.Client;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ClientRepository extends JpaRepository<Client, UUID> {
    List<Client> findAllByCreatedBy(UUID createdBy);
    List<Client> findAllByOrderByCreatedAtDesc();
}
