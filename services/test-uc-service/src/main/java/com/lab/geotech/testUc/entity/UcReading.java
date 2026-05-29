package com.lab.geotech.testUc.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "uc_readings", schema = "test_uc")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UcReading {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_id")
    private UcTest ucTest;

    @Column(name = "reading_number", nullable = false)
    private int readingNumber;

    @Column(name = "deformation_div", nullable = false, precision = 10, scale = 2)
    private BigDecimal deformationDiv;

    @Column(name = "proving_ring_div", nullable = false, precision = 10, scale = 2)
    private BigDecimal provingRingDiv;

    @Column(name = "deformation_mm", precision = 10, scale = 4)
    private BigDecimal deformationMm;

    @Column(name = "load_n", precision = 10, scale = 4)
    private BigDecimal loadN;

    @Column(name = "strain_pct", precision = 10, scale = 4)
    private BigDecimal strainPct;

    @Column(name = "corrected_area_cm2", precision = 10, scale = 4)
    private BigDecimal correctedAreaCm2;

    @Column(name = "stress_kpa", precision = 10, scale = 3)
    private BigDecimal stressKpa;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
