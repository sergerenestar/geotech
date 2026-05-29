package com.lab.geotech.testPs.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "ps_hydrometer_readings", schema = "test_ps")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PsHydrometerReading {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_id", nullable = false)
    private PsTest psTest;

    @Column(name = "reading_number", nullable = false)
    private int readingNumber;

    @Column(name = "elapsed_time_min", nullable = false, precision = 10, scale = 2)
    private BigDecimal elapsedTimeMin;

    @Column(name = "hydrometer_reading", nullable = false, precision = 8, scale = 3)
    private BigDecimal hydrometerReading;

    @Column(name = "temperature_c", nullable = false, precision = 5, scale = 1)
    private BigDecimal temperatureC;

    // Calculated
    @Column(name = "corrected_reading", precision = 8, scale = 3)
    private BigDecimal correctedReading;

    @Column(name = "particle_diameter_mm", precision = 12, scale = 8)
    private BigDecimal particleDiameterMm;

    @Column(name = "pct_finer", precision = 8, scale = 3)
    private BigDecimal pctFiner;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
