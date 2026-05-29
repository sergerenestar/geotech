package com.lab.geotech.testConsol.entity;

import com.lab.geotech.testConsol.constant.LoadType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "consol_stages", schema = "test_consol")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConsolStage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_id")
    private ConsolTest consolTest;

    @Column(name = "stage_number", nullable = false)
    private int stageNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "load_type", nullable = false, length = 12)
    private LoadType loadType;

    @Column(name = "sigma_v_kpa", nullable = false, precision = 10, scale = 3)
    private BigDecimal sigmaVKpa;

    @Column(name = "e_final", precision = 8, scale = 4)
    private BigDecimal eFinal;

    @Column(name = "cv_m2_yr", precision = 14, scale = 6)
    private BigDecimal cvM2Yr;

    @Column(name = "mv_m2_kn", precision = 14, scale = 8)
    private BigDecimal mvM2Kn;

    @Column(name = "t50_min", precision = 12, scale = 4)
    private BigDecimal t50Min;

    @Column(name = "t90_min", precision = 12, scale = 4)
    private BigDecimal t90Min;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @OneToMany(mappedBy = "consolStage", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("readingNumber ASC")
    @Builder.Default
    private List<ConsolReading> readings = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
        if (loadType == null) {
            loadType = LoadType.LOADING;
        }
    }
}
