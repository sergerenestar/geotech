package com.lab.geotech.project.service;

import com.lab.geotech.project.dto.SampleCreateDto;
import com.lab.geotech.project.dto.SampleResponse;
import com.lab.geotech.project.entity.Borehole;
import com.lab.geotech.project.entity.Sample;
import com.lab.geotech.project.exception.ResourceNotFoundException;
import com.lab.geotech.project.repository.BoreholeRepository;
import com.lab.geotech.project.repository.SampleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SampleService {

    private final SampleRepository sampleRepository;
    private final BoreholeRepository boreholeRepository;

    public List<SampleResponse> getByBorehole(UUID boreholeId) {
        return sampleRepository.findAllByBoreholeId(boreholeId).stream()
                .map(SampleResponse::from).toList();
    }

    public SampleResponse getById(UUID id) {
        return sampleRepository.findById(id)
                .map(SampleResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("Sample", id));
    }

    @Transactional
    public SampleResponse create(SampleCreateDto dto) {
        Borehole borehole = boreholeRepository.findById(dto.boreholeId())
                .orElseThrow(() -> new ResourceNotFoundException("Borehole", dto.boreholeId()));
        Sample sample = Sample.builder()
                .borehole(borehole)
                .sampleCode(dto.sampleCode())
                .depthFromM(dto.depthFromM())
                .depthToM(dto.depthToM())
                .soilDescription(dto.soilDescription())
                .uscsSymbol(dto.uscsSymbol())
                .aashtoClass(dto.aashtoClass())
                .deleted(false)
                .build();
        return SampleResponse.from(sampleRepository.save(sample));
    }

    @Transactional
    public void softDelete(UUID id) {
        Sample sample = sampleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sample", id));
        sample.setDeleted(true);
        sampleRepository.save(sample);
    }
}
