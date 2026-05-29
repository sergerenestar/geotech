package com.lab.geotech.testPs.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "ps_sieve_results", schema = "test_ps")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PsSieveResult {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_id", nullable = false)
    private PsTest psTest;

    @Column(name = "sieve_label", nullable = false, length = 20)
    private String sieveLabel;

    @Column(name = "opening_mm", nullable = false, precision = 10, scale = 4)
    private BigDecimal openingMm;

    @Column(name = "mass_retained_g", nullable = false, precision = 10, scale = 3)
    private BigDecimal massRetainedG;

    // Calculated
    @Column(name = "pct_retained", precision = 8, scale = 3)
    private BigDecimal pctRetained;

    @Column(name = "pct_finer", precision = 8, scale = 3)
    private BigDecimal pctFiner;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
