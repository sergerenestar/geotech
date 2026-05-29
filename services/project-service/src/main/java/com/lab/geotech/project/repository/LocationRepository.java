package com.lab.geotech.project.repository;

import com.lab.geotech.project.entity.Location;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface LocationRepository extends JpaRepository<Location, UUID> {}
