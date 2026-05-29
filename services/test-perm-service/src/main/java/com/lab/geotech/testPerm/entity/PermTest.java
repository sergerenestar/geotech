package com.lab.geotech.testPerm.entity;

import com.lab.geotech.testPerm.constant.AiFlag;
import com.lab.geotech.testPerm.constant.TestStatus;
import com.lab.geotech.testPerm.constant.TestType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLRestriction;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "perm_tests", schema = "test_perm")
@SQLRestriction("is_deleted = false")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PermTest {

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

    @Enumerated(EnumType.STRING)
    @Column(name = "test_type", nullable = false, length = 20)
    private TestType testType;

    @Column(name = "specimen_diameter_mm", nullable = false, precision = 10, scale = 3)
    private BigDecimal specimenDiameterMm;

    @Column(name = "specimen_length_mm", nullable = false, precision = 10, scale = 3)
    private BigDecimal specimenLengthMm;

    @Column(name = "water_temperature_c", nullable = false, precision = 6, scale = 2)
    private BigDecimal waterTemperatureC;

    @Column(name = "standpipe_area_cm2", precision = 10, scale = 4)
    private BigDecimal standpipeAreaCm2;

    @Column(name = "head_cm", precision = 10, scale = 3)
    private BigDecimal headCm;

    @Column(name = "k_cms", precision = 14, scale = 8)
    private BigDecimal kCms;

    @Column(name = "k_at20c_cms", precision = 14, scale = 8)
    private BigDecimal kAt20cCms;

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

    @OneToMany(mappedBy = "permTest", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("readingNumber ASC")
    @Builder.Default
    private List<PermReading> readings = new ArrayList<>();

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
        if (testType == null) {
            testType = TestType.CONSTANT_HEAD;
        }
        if (waterTemperatureC == null) {
            waterTemperatureC = new BigDecimal("20.0");
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
