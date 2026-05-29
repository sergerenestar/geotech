package com.lab.geotech.testPerm.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "perm_readings", schema = "test_perm")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PermReading {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_id")
    private PermTest permTest;

    @Column(name = "reading_number", nullable = false)
    private int readingNumber;

    @Column(name = "flow_volume_ml", precision = 10, scale = 3)
    private BigDecimal flowVolumeMl;

    @Column(name = "initial_head_cm", precision = 10, scale = 3)
    private BigDecimal initialHeadCm;

    @Column(name = "final_head_cm", precision = 10, scale = 3)
    private BigDecimal finalHeadCm;

    @Column(name = "elapsed_time_s", nullable = false, precision = 12, scale = 3)
    private BigDecimal elapsedTimeS;

    @Column(name = "k_cms", precision = 14, scale = 8)
    private BigDecimal kCms;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
    }
}
