package com.lab.geotech.testDs.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "ds_readings", schema = "test_ds")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DsReading {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stage_id")
    private DsStage dsStage;

    @Column(name = "reading_number", nullable = false)
    private int readingNumber;

    @Column(name = "displacement_div", nullable = false, precision = 10, scale = 2)
    private BigDecimal displacementDiv;

    @Column(name = "proving_ring_div", nullable = false, precision = 10, scale = 2)
    private BigDecimal provingRingDiv;

    @Column(name = "displacement_mm", precision = 10, scale = 4)
    private BigDecimal displacementMm;

    @Column(name = "shear_force_n", precision = 10, scale = 4)
    private BigDecimal shearForceN;

    @Column(name = "shear_stress_kpa", precision = 10, scale = 3)
    private BigDecimal shearStressKpa;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
    }
}
