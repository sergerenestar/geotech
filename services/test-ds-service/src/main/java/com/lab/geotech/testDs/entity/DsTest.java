package com.lab.geotech.testDs.entity;

import com.lab.geotech.testDs.constant.AiFlag;
import com.lab.geotech.testDs.constant.TestStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLRestriction;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "ds_tests", schema = "test_ds")
@SQLRestriction("is_deleted = false")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DsTest {

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
    @Column(name = "status", nullable = false, length = 20)
    private TestStatus status;

    @Column(name = "box_width_mm", nullable = false, precision = 8, scale = 3)
    private BigDecimal boxWidthMm;

    @Column(name = "box_length_mm", nullable = false, precision = 8, scale = 3)
    private BigDecimal boxLengthMm;

    @Column(name = "specimen_height_mm", precision = 8, scale = 3)
    private BigDecimal specimenHeightMm;

    @Column(name = "dial_factor_mm_per_div", nullable = false, precision = 10, scale = 6)
    private BigDecimal dialFactorMmPerDiv;

    @Column(name = "calibration_factor_n_per_div", nullable = false, precision = 10, scale = 4)
    private BigDecimal calibrationFactorNPerDiv;

    @Column(name = "cohesion_kpa", precision = 10, scale = 3)
    private BigDecimal cohesionKpa;

    @Column(name = "friction_angle_deg", precision = 8, scale = 3)
    private BigDecimal frictionAngleDeg;

    @Column(name = "r_squared", precision = 8, scale = 6)
    private BigDecimal rSquared;

    @Column(name = "notes")
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(name = "ai_flag", nullable = false, length = 10)
    private AiFlag aiFlag;

    @Column(name = "ai_flag_message")
    private String aiFlagMessage;

    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private boolean isDeleted = false;

    @OneToMany(mappedBy = "dsTest", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("stageNumber ASC")
    @Builder.Default
    private List<DsStage> stages = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
        updatedAt = OffsetDateTime.now();
        if (status == null) {
            status = TestStatus.DRAFT;
        }
        if (aiFlag == null) {
            aiFlag = AiFlag.NONE;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
