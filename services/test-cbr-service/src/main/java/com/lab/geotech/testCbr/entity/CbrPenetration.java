package com.lab.geotech.testCbr.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "cbr_penetration", schema = "test_cbr")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CbrPenetration {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "intensity_id", nullable = false)
    private CbrIntensity intensity;

    @Column(name = "penetration_mm", nullable = false, precision = 6, scale = 3)
    private BigDecimal penetrationMm;

    @Column(name = "ring_reading", precision = 10, scale = 2)
    private BigDecimal ringReading;

    @Column(name = "load_kn", precision = 8, scale = 3)
    private BigDecimal loadKn;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
