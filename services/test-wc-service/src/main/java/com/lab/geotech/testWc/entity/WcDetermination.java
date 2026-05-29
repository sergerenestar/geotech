package com.lab.geotech.testWc.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "wc_determinations", schema = "test_wc")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WcDetermination {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_id", nullable = false)
    private WcTest wcTest;

    @Column(name = "determination_number", nullable = false)
    private int determinationNumber;

    @Column(name = "mass_container_g", nullable = false, precision = 8, scale = 3)
    private BigDecimal massContainerG;

    @Column(name = "mass_container_wet_soil_g", nullable = false, precision = 8, scale = 3)
    private BigDecimal massContainerWetSoilG;

    @Column(name = "mass_container_dry_soil_g", nullable = false, precision = 8, scale = 3)
    private BigDecimal massContainerDrySoilG;

    @Column(name = "mass_water_g", precision = 8, scale = 3)
    private BigDecimal massWaterG;

    @Column(name = "mass_dry_soil_g", precision = 8, scale = 3)
    private BigDecimal massDrySoilG;

    @Column(name = "water_content_pct", precision = 8, scale = 3)
    private BigDecimal waterContentPct;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
