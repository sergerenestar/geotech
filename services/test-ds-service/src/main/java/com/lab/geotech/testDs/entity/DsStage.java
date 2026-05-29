package com.lab.geotech.testDs.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "ds_stages", schema = "test_ds")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DsStage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_id")
    private DsTest dsTest;

    @Column(name = "stage_number", nullable = false)
    private int stageNumber;

    @Column(name = "normal_stress_kpa", nullable = false, precision = 10, scale = 3)
    private BigDecimal normalStressKpa;

    @Column(name = "peak_shear_stress_kpa", precision = 10, scale = 3)
    private BigDecimal peakShearStressKpa;

    @Column(name = "displacement_at_peak_mm", precision = 10, scale = 4)
    private BigDecimal displacementAtPeakMm;

    @OneToMany(mappedBy = "dsStage", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("readingNumber ASC")
    @Builder.Default
    private List<DsReading> readings = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
    }
}
