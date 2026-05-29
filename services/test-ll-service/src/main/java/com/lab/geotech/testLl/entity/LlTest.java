package com.lab.geotech.testLl.entity;

import com.lab.geotech.testLl.constant.AiFlag;
import com.lab.geotech.testLl.constant.TestMethod;
import com.lab.geotech.testLl.constant.TestStatus;
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
@Table(name = "ll_tests", schema = "test_ll")
@SQLRestriction("is_deleted = false")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LlTest {

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
    private TestMethod method;

    @Column(name = "ll_pct", precision = 8, scale = 3)
    private BigDecimal llPct;

    @Column(name = "pl_pct", precision = 8, scale = 3)
    private BigDecimal plPct;

    @Column(name = "pi_pct", precision = 8, scale = 3)
    private BigDecimal piPct;

    @Column(name = "r_squared", precision = 8, scale = 6)
    private BigDecimal rSquared;

    @Column(name = "liquidity_index", precision = 8, scale = 3)
    private BigDecimal liquidityIndex;

    @Column(name = "activity", precision = 8, scale = 3)
    private BigDecimal activity;

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

    @OneToMany(mappedBy = "llTest", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("pointNumber ASC")
    @Builder.Default
    private List<LlCasagrandePoint> casagrandePoints = new ArrayList<>();

    @OneToMany(mappedBy = "llTest", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("determinationNumber ASC")
    @Builder.Default
    private List<LlPlDetermination> plDeterminations = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}
