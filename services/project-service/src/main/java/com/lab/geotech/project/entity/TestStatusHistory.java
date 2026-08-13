package com.lab.geotech.project.entity;

import com.lab.geotech.project.constant.WorkflowStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "test_status_history", schema = "projects")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TestStatusHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "project_test_id", nullable = false)
    private UUID projectTestId;

    @Enumerated(EnumType.STRING)
    @Column(name = "from_status", length = 30)
    private WorkflowStatus fromStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "to_status", nullable = false, length = 30)
    private WorkflowStatus toStatus;

    @Column(name = "changed_by", nullable = false)
    private UUID changedBy;

    @Column(name = "role", nullable = false, length = 30)
    private String role;

    @CreationTimestamp
    @Column(name = "changed_at", nullable = false, updatable = false)
    private OffsetDateTime changedAt;
}
