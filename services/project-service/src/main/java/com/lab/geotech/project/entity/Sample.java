package com.lab.geotech.project.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.Where;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "samples", schema = "projects")
@Where(clause = "is_deleted = false")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Sample {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "borehole_id", nullable = false)
    private Borehole borehole;

    @Column(name = "sample_code", nullable = false, length = 50)
    private String sampleCode;

    @Column(name = "depth_from_m", precision = 8, scale = 2)
    private BigDecimal depthFromM;

    @Column(name = "depth_to_m", precision = 8, scale = 2)
    private BigDecimal depthToM;

    @Column(name = "soil_description", columnDefinition = "TEXT")
    private String soilDescription;

    @Column(name = "uscs_symbol", length = 10)
    private String uscsSymbol;

    @Column(name = "aashto_class", length = 20)
    private String aashtoClass;

    @Column(name = "is_deleted", nullable = false)
    private boolean deleted;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}
