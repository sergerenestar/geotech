package com.lab.geotech.testPs.entity;

import com.lab.geotech.testPs.constant.AiFlag;
import com.lab.geotech.testPs.constant.PsTestType;
import com.lab.geotech.testPs.constant.TestStatus;
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
@Table(name = "ps_tests", schema = "test_ps")
@SQLRestriction("is_deleted = false")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PsTest {

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
    @Column(name = "test_type", nullable = false, length = 20)
    private PsTestType testType;

    @Column(name = "total_dry_mass_g", nullable = false, precision = 10, scale = 3)
    private BigDecimal totalDryMassG;

    @Column(name = "specific_gravity", nullable = false, precision = 8, scale = 4)
    private BigDecimal specificGravity;

    // Fraction results (calculated)
    @Column(name = "pct_gravel", precision = 8, scale = 3)
    private BigDecimal pctGravel;

    @Column(name = "pct_sand", precision = 8, scale = 3)
    private BigDecimal pctSand;

    @Column(name = "pct_fines", precision = 8, scale = 3)
    private BigDecimal pctFines;

    @Column(name = "pct_clay", precision = 8, scale = 3)
    private BigDecimal pctClay;

    // Characteristic diameters (calculated)
    @Column(name = "d10_mm", precision = 12, scale = 6)
    private BigDecimal d10Mm;

    @Column(name = "d30_mm", precision = 12, scale = 6)
    private BigDecimal d30Mm;

    @Column(name = "d60_mm", precision = 12, scale = 6)
    private BigDecimal d60Mm;

    @Column(name = "cu", precision = 10, scale = 4)
    private BigDecimal cu;

    @Column(name = "cc", precision = 10, scale = 4)
    private BigDecimal cc;

    // Classification
    @Column(name = "uscs_symbol", length = 10)
    private String uscsSymbol;

    @Column(name = "uscs_name", length = 100)
    private String uscsName;

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

    @OneToMany(mappedBy = "psTest", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("openingMm DESC")
    @Builder.Default
    private List<PsSieveResult> sieveResults = new ArrayList<>();

    @OneToMany(mappedBy = "psTest", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("readingNumber ASC")
    @Builder.Default
    private List<PsHydrometerReading> hydrometerReadings = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}
