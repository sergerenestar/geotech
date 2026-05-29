package com.lab.geotech.testUc.entity;

import com.lab.geotech.testUc.constant.AiFlag;
import com.lab.geotech.testUc.constant.TestStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.SQLRestriction;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "uc_tests", schema = "test_uc")
@SQLRestriction("is_deleted = false")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UcTest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "sample_id")
    private UUID sampleId;

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "borehole_id")
    private UUID boreholeId;

    @Column(name = "technician_id", nullable = false)
    private UUID technicianId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TestStatus status;

    @Column(name = "initial_height_mm", nullable = false, precision = 8, scale = 3)
    private BigDecimal initialHeightMm;

    @Column(name = "initial_diameter_mm", nullable = false, precision = 8, scale = 3)
    private BigDecimal initialDiameterMm;

    @Column(name = "dial_gauge_factor_mm_per_div", nullable = false, precision = 10, scale = 6)
    private BigDecimal dialGaugeFactorMmPerDiv;

    @Column(name = "calibration_factor_n_per_div", nullable = false, precision = 10, scale = 4)
    private BigDecimal calibrationFactorNPerDiv;

    @Column(name = "qu_kpa", precision = 10, scale = 3)
    private BigDecimal quKpa;

    @Column(name = "su_kpa", precision = 10, scale = 3)
    private BigDecimal suKpa;

    @Column(name = "failure_strain_pct", precision = 8, scale = 3)
    private BigDecimal failureStrainPct;

    @Column(name = "failure_mode", length = 50)
    private String failureMode;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(name = "ai_flag", nullable = false, length = 10)
    private AiFlag aiFlag;

    @Column(name = "ai_flag_message", columnDefinition = "TEXT")
    private String aiFlagMessage;

    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private boolean isDeleted = false;

    @OneToMany(mappedBy = "ucTest", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("readingNumber ASC")
    @Builder.Default
    private List<UcReading> readings = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}
