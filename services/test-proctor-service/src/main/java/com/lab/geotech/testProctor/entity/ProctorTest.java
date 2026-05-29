package com.lab.geotech.testProctor.entity;

import com.lab.geotech.testProctor.constant.AiFlag;
import com.lab.geotech.testProctor.constant.ProctorMethod;
import com.lab.geotech.testProctor.constant.TestStatus;
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
@Table(name = "proctor_tests", schema = "test_proctor")
@SQLRestriction("is_deleted = false")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProctorTest {

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

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ProctorMethod method;

    @Column(name = "mold_volume_cm3", nullable = false, precision = 10, scale = 3)
    private BigDecimal moldVolumeCm3;

    @Column(name = "mold_mass_g", nullable = false, precision = 10, scale = 3)
    private BigDecimal moldMassG;

    @Column(name = "specific_gravity", precision = 6, scale = 4)
    private BigDecimal specificGravity;

    @Column(name = "gd_max_kn_m3", precision = 10, scale = 4)
    private BigDecimal gdMaxKnM3;

    @Column(name = "omc_pct", precision = 8, scale = 3)
    private BigDecimal omcPct;

    @Column(name = "r_squared", precision = 8, scale = 6)
    private BigDecimal rSquared;

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

    @OneToMany(mappedBy = "proctorTest", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("pointNumber ASC")
    @Builder.Default
    private List<ProctorPoint> points = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}
