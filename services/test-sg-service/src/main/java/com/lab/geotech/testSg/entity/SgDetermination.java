package com.lab.geotech.testSg.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "sg_determinations", schema = "test_sg")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SgDetermination {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_id", nullable = false)
    private SgTest sgTest;

    @Column(name = "determination_number", nullable = false)
    private int determinationNumber;

    @Column(name = "flask_number", length = 20)
    private String flaskNumber;

    @Column(name = "mass_dry_soil_g", nullable = false, precision = 10, scale = 4)
    private BigDecimal massDrySoilG;

    @Column(name = "mass_flask_water_g", nullable = false, precision = 10, scale = 4)
    private BigDecimal massFlaskWaterG;

    @Column(name = "mass_flask_soil_water_g", nullable = false, precision = 10, scale = 4)
    private BigDecimal massFlaskSoilWaterG;

    @Column(name = "temperature_c", nullable = false, precision = 6, scale = 2)
    private BigDecimal temperatureC;

    @Column(name = "gs_at_temp", precision = 8, scale = 4)
    private BigDecimal gsAtTemp;

    @Column(name = "k_factor", precision = 8, scale = 6)
    private BigDecimal kFactor;

    @Column(name = "gs_20", precision = 8, scale = 4)
    private BigDecimal gs20;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
