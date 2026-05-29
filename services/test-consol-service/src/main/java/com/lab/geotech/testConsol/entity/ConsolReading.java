package com.lab.geotech.testConsol.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "consol_readings", schema = "test_consol")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConsolReading {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stage_id")
    private ConsolStage consolStage;

    @Column(name = "reading_number", nullable = false)
    private int readingNumber;

    @Column(name = "time_min", nullable = false, precision = 12, scale = 4)
    private BigDecimal timeMin;

    @Column(name = "dial_reading_mm", nullable = false, precision = 10, scale = 4)
    private BigDecimal dialReadingMm;

    @Column(name = "settlement_mm", precision = 10, scale = 4)
    private BigDecimal settlementMm;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
    }
}
