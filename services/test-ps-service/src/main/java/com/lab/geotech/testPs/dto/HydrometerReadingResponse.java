package com.lab.geotech.testPs.dto;

import com.lab.geotech.testPs.entity.PsHydrometerReading;

import java.math.BigDecimal;
import java.util.UUID;

public record HydrometerReadingResponse(
        UUID id,
        int readingNumber,
        BigDecimal elapsedTimeMin,
        BigDecimal hydrometerReading,
        BigDecimal temperatureC,
        BigDecimal correctedReading,
        BigDecimal particleDiameterMm,
        BigDecimal pctFiner
) {
    public static HydrometerReadingResponse from(PsHydrometerReading r) {
        return new HydrometerReadingResponse(
                r.getId(),
                r.getReadingNumber(),
                r.getElapsedTimeMin(),
                r.getHydrometerReading(),
                r.getTemperatureC(),
                r.getCorrectedReading(),
                r.getParticleDiameterMm(),
                r.getPctFiner()
        );
    }
}
