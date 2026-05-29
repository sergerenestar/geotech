package com.lab.geotech.testCbr.entity;

import com.lab.geotech.testCbr.constant.TestStatus;
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
@Table(name = "cbr_tests", schema = "test_cbr")
@SQLRestriction("is_deleted = false")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CbrTest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "borehole_id")
    private UUID boreholeId;

    @Column(name = "sample_id")
    private UUID sampleId;

    @Column(name = "technician_id", nullable = false)
    private UUID technicianId;

    @Column(name = "reference", length = 100)
    private String reference;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TestStatus status;

    @Column(name = "specific_gravity", precision = 6, scale = 4, nullable = false)
    private BigDecimal specificGravity;

    @Column(name = "proctor_gdmax_tm3", precision = 8, scale = 4)
    private BigDecimal proctorGdmaxTm3;

    @Column(name = "proctor_omc_pct", precision = 6, scale = 2)
    private BigDecimal proctorOmcPct;

    @Column(name = "ring_coefficient", precision = 8, scale = 5, nullable = false)
    private BigDecimal ringCoefficient;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private boolean isDeleted = false;

    @OneToMany(mappedBy = "cbrTest", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("blows DESC")
    @Builder.Default
    private List<CbrIntensity> intensities = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}
