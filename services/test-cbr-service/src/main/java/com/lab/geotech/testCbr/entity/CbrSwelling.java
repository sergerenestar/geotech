package com.lab.geotech.testCbr.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "cbr_swelling", schema = "test_cbr")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CbrSwelling {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "intensity_id", nullable = false)
    private CbrIntensity intensity;

    @Column(nullable = false)
    private Integer hours;

    @Column(name = "reading_mm", precision = 6, scale = 2)
    private BigDecimal readingMm;

    @Column(name = "swelling_pct", precision = 6, scale = 3)
    private BigDecimal swellingPct;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
