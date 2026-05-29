package com.lab.geotech.testProctor.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "proctor_points", schema = "test_proctor")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProctorPoint {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_id")
    private ProctorTest proctorTest;

    @Column(name = "point_number", nullable = false)
    private int pointNumber;

    @Column(name = "mass_mold_soil_g", nullable = false, precision = 10, scale = 3)
    private BigDecimal massMoldSoilG;

    @Column(name = "water_content_pct", nullable = false, precision = 8, scale = 3)
    private BigDecimal waterContentPct;

    @Column(name = "wet_unit_weight_kn_m3", precision = 10, scale = 4)
    private BigDecimal wetUnitWeightKnM3;

    @Column(name = "dry_unit_weight_kn_m3", precision = 10, scale = 4)
    private BigDecimal dryUnitWeightKnM3;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
