package com.lab.geotech.project.service;

import com.lab.geotech.project.dto.LocationCreateDto;
import com.lab.geotech.project.dto.LocationResponse;
import com.lab.geotech.project.entity.Location;
import com.lab.geotech.project.exception.ResourceNotFoundException;
import com.lab.geotech.project.repository.LocationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LocationService {

    private final LocationRepository locationRepository;

    public Page<LocationResponse> getAll(Pageable pageable) {
        return locationRepository.findAll(pageable).map(LocationResponse::from);
    }

    public LocationResponse getById(UUID id) {
        return locationRepository.findById(id)
                .map(LocationResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("Location", id));
    }

    @Transactional
    public LocationResponse create(LocationCreateDto dto) {
        Location location = Location.builder()
                .name(dto.name())
                .address(dto.address())
                .city(dto.city())
                .country(dto.country())
                .latitude(dto.latitude())
                .longitude(dto.longitude())
                .deleted(false)
                .build();
        return LocationResponse.from(locationRepository.save(location));
    }

    @Transactional
    public void delete(UUID id) {
        Location location = locationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Location", id));
        location.setDeleted(true);
        locationRepository.save(location);
    }
}
