package com.lab.geotech.testCbr.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "cbr_intensities", schema = "test_cbr")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CbrIntensity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_id", nullable = false)
    private CbrTest cbrTest;

    @Column(nullable = false)
    private Integer blows;

    @Column(name = "mass_mold_g", precision = 10, scale = 2)
    private BigDecimal massMoldG;

    @Column(name = "mass_wet_g", precision = 10, scale = 2)
    private BigDecimal massWetG;

    @Column(name = "mass_dry_g", precision = 10, scale = 2)
    private BigDecimal massDryG;

    @Column(name = "water_content_pct", precision = 6, scale = 2)
    private BigDecimal waterContentPct;

    @Column(name = "dry_density_tm3", precision = 8, scale = 4)
    private BigDecimal dryDensityTm3;

    @Column(name = "compaction_degree_pct", precision = 6, scale = 2)
    private BigDecimal compactionDegreePct;

    @Column(name = "cbr_25mm", precision = 8, scale = 2)
    private BigDecimal cbr25mm;

    @Column(name = "cbr_50mm", precision = 8, scale = 2)
    private BigDecimal cbr50mm;

    @Column(name = "cbr_index", precision = 8, scale = 2)
    private BigDecimal cbrIndex;

    @OneToMany(mappedBy = "intensity", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("hours ASC")
    @Builder.Default
    private List<CbrSwelling> swellingReadings = new ArrayList<>();

    @OneToMany(mappedBy = "intensity", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("penetrationMm ASC")
    @Builder.Default
    private List<CbrPenetration> penetrationReadings = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
