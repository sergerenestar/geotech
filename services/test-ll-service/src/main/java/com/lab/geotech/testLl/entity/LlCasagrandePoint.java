package com.lab.geotech.testLl.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "ll_casagrande_points", schema = "test_ll")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LlCasagrandePoint {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_id", nullable = false)
    private LlTest llTest;

    @Column(name = "point_number", nullable = false)
    private int pointNumber;

    @Column(name = "blow_count", nullable = false)
    private int blowCount;

    @Column(name = "mass_container_g", nullable = false, precision = 8, scale = 3)
    private BigDecimal massContainerG;

    @Column(name = "mass_container_wet_soil_g", nullable = false, precision = 8, scale = 3)
    private BigDecimal massContainerWetSoilG;

    @Column(name = "mass_container_dry_soil_g", nullable = false, precision = 8, scale = 3)
    private BigDecimal massContainerDrySoilG;

    @Column(name = "water_content_pct", precision = 8, scale = 3)
    private BigDecimal waterContentPct;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
