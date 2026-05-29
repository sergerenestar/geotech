package com.lab.geotech.testWc.entity;

import com.lab.geotech.testWc.constant.AiFlag;
import com.lab.geotech.testWc.constant.TestStatus;
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
@Table(name = "wc_tests", schema = "test_wc")
@SQLRestriction("is_deleted = false")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WcTest {

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

    @Column(name = "temperature_c", precision = 5, scale = 1)
    private BigDecimal temperatureC;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "average_water_content_pct", precision = 8, scale = 3)
    private BigDecimal averageWaterContentPct;

    @Enumerated(EnumType.STRING)
    @Column(name = "ai_flag", nullable = false, length = 10)
    private AiFlag aiFlag;

    @Column(name = "ai_flag_message", columnDefinition = "TEXT")
    private String aiFlagMessage;

    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private boolean isDeleted = false;

    @OneToMany(mappedBy = "wcTest", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("determinationNumber ASC")
    @Builder.Default
    private List<WcDetermination> determinations = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}
