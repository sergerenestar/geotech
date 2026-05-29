package com.lab.geotech.testConsol.entity;

import com.lab.geotech.testConsol.constant.AiFlag;
import com.lab.geotech.testConsol.constant.DrainageType;
import com.lab.geotech.testConsol.constant.TestStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLRestriction;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "consol_tests", schema = "test_consol")
@SQLRestriction("is_deleted = false")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConsolTest {

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

    @Column(name = "specimen_diameter_mm", nullable = false, precision = 10, scale = 3)
    private BigDecimal specimenDiameterMm;

    @Column(name = "initial_height_mm", nullable = false, precision = 10, scale = 3)
    private BigDecimal initialHeightMm;

    @Column(name = "initial_void_ratio", nullable = false, precision = 8, scale = 4)
    private BigDecimal initialVoidRatio;

    @Column(name = "specific_gravity", nullable = false, precision = 6, scale = 4)
    private BigDecimal specificGravity;

    @Enumerated(EnumType.STRING)
    @Column(name = "drainage_type", nullable = false, length = 15)
    private DrainageType drainageType;

    @Column(name = "cc", precision = 8, scale = 4)
    private BigDecimal cc;

    @Column(name = "cs", precision = 8, scale = 4)
    private BigDecimal cs;

    @Column(name = "sigma_p_kpa", precision = 10, scale = 3)
    private BigDecimal sigmaPKpa;

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

    @OneToMany(mappedBy = "consolTest", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("stageNumber ASC")
    @Builder.Default
    private List<ConsolStage> stages = new ArrayList<>();

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
        if (drainageType == null) {
            drainageType = DrainageType.DOUBLE;
        }
        if (specificGravity == null) {
            specificGravity = new BigDecimal("2.7");
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
