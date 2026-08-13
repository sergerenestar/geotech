package com.lab.geotech.project;

import com.lab.geotech.project.constant.TestType;
import com.lab.geotech.project.constant.WorkflowStatus;
import com.lab.geotech.project.dto.TestWorkflowResponse;
import com.lab.geotech.project.entity.Project;
import com.lab.geotech.project.entity.ProjectTest;
import com.lab.geotech.project.exception.InvalidWorkflowTransitionException;
import com.lab.geotech.project.repository.ProjectRepository;
import com.lab.geotech.project.repository.ProjectTestRepository;
import com.lab.geotech.project.repository.TestCommentRepository;
import com.lab.geotech.project.repository.TestStatusHistoryRepository;
import com.lab.geotech.project.service.TestWorkflowService;
import com.lab.geotech.project.constant.ProjectStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.context.ActiveProfiles;

import java.util.UUID;

import static org.assertj.core.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
class TestWorkflowServiceTest {

    @Autowired TestWorkflowService workflowService;
    @Autowired ProjectRepository projectRepo;
    @Autowired ProjectTestRepository testRepo;
    @Autowired TestStatusHistoryRepository historyRepo;
    @Autowired TestCommentRepository commentRepo;
    @Autowired JdbcTemplate jdbc;

    private static final UUID PM_ID   = UUID.randomUUID();
    private static final UUID LM_ID   = UUID.randomUUID();
    private static final UUID TECH_ID = UUID.randomUUID();

    private Project project;
    private ProjectTest projectTest;

    @BeforeEach
    void setUp() {
        jdbc.execute("DELETE FROM projects.test_comments");
        jdbc.execute("DELETE FROM projects.test_status_history");
        jdbc.execute("DELETE FROM projects.project_tests");
        jdbc.execute("DELETE FROM projects.samples");
        jdbc.execute("DELETE FROM projects.boreholes");
        jdbc.execute("DELETE FROM projects.projects");

        project = projectRepo.save(Project.builder()
                .projectCode("GT-2099-0001")
                .name("Workflow Test Project")
                .status(ProjectStatus.ACTIVE)
                .createdBy(PM_ID)
                .deleted(false)
                .build());

        projectTest = testRepo.save(ProjectTest.builder()
                .projectId(project.getId())
                .testType(TestType.WATER_CONTENT)
                .labManagerId(LM_ID)
                .technicianId(TECH_ID)
                .workflowStatus(WorkflowStatus.IN_PROGRESS)
                .build());
    }

    // ── Happy path: full approval chain ─────────────────────────────────────

    @Test
    void fullApprovalChain_transitionsThroughAllStates() {
        // Tech submits
        TestWorkflowResponse r1 = workflowService.submit(projectTest.getId(), TECH_ID, "TECHNICIAN", "All done");
        assertThat(r1.workflowStatus()).isEqualTo("PENDING_MANAGER_REVIEW");
        assertThat(r1.comments()).hasSize(1);
        assertThat(r1.comments().get(0).action()).isEqualTo("SUBMITTED");

        // Manager approves
        TestWorkflowResponse r2 = workflowService.managerApprove(projectTest.getId(), LM_ID, "LAB_MANAGER", "Looks good");
        assertThat(r2.workflowStatus()).isEqualTo("PENDING_PM_REVIEW");

        // PM approves
        TestWorkflowResponse r3 = workflowService.pmApprove(projectTest.getId(), PM_ID, "PROJECT_MANAGER", "Excellent");
        assertThat(r3.workflowStatus()).isEqualTo("APPROVED");
        assertThat(r3.comments()).hasSize(3);
        assertThat(r3.history()).hasSize(3);
    }

    // ── Happy path: rejection back to tech ──────────────────────────────────

    @Test
    void managerRejectsToTech_thenTechResubmits() {
        workflowService.submit(projectTest.getId(), TECH_ID, "TECHNICIAN", "First attempt");
        workflowService.managerReject(projectTest.getId(), LM_ID, "LAB_MANAGER", "Needs correction");

        TestWorkflowResponse rejected = workflowService.getActive(TECH_ID, "TECHNICIAN").stream()
                .filter(t -> t.id().equals(projectTest.getId()))
                .findFirst().orElseThrow();
        assertThat(rejected.workflowStatus()).isEqualTo("REJECTED_TO_TECH");

        // Tech resubmits
        TestWorkflowResponse resubmitted = workflowService.submit(projectTest.getId(), TECH_ID, "TECHNICIAN", "Fixed");
        assertThat(resubmitted.workflowStatus()).isEqualTo("PENDING_MANAGER_REVIEW");
    }

    // ── Happy path: PM rejection back to manager ─────────────────────────────

    @Test
    void pmRejectsToManager_thenManagerForwardsAgain() {
        workflowService.submit(projectTest.getId(), TECH_ID, "TECHNICIAN", null);
        workflowService.managerApprove(projectTest.getId(), LM_ID, "LAB_MANAGER", null);
        workflowService.pmReject(projectTest.getId(), PM_ID, "PROJECT_MANAGER", "Add supporting data");

        // Manager sees it as active
        TestWorkflowResponse active = workflowService.getActive(LM_ID, "LAB_MANAGER").stream()
                .filter(t -> t.id().equals(projectTest.getId()))
                .findFirst().orElseThrow();
        assertThat(active.workflowStatus()).isEqualTo("REJECTED_TO_MANAGER");

        // Manager re-approves
        TestWorkflowResponse reFwd = workflowService.managerApprove(projectTest.getId(), LM_ID, "LAB_MANAGER", "Updated");
        assertThat(reFwd.workflowStatus()).isEqualTo("PENDING_PM_REVIEW");
    }

    // ── Access control: wrong user cannot act ────────────────────────────────

    @Test
    void wrongTechnician_cannotSubmit() {
        UUID otherId = UUID.randomUUID();
        assertThatThrownBy(() -> workflowService.submit(projectTest.getId(), otherId, "TECHNICIAN", null))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void wrongManager_cannotApprove() {
        workflowService.submit(projectTest.getId(), TECH_ID, "TECHNICIAN", null);
        UUID otherId = UUID.randomUUID();
        assertThatThrownBy(() -> workflowService.managerApprove(projectTest.getId(), otherId, "LAB_MANAGER", null))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void wrongPm_cannotApprove() {
        workflowService.submit(projectTest.getId(), TECH_ID, "TECHNICIAN", null);
        workflowService.managerApprove(projectTest.getId(), LM_ID, "LAB_MANAGER", null);
        UUID otherId = UUID.randomUUID();
        assertThatThrownBy(() -> workflowService.pmApprove(projectTest.getId(), otherId, "PROJECT_MANAGER", null))
                .isInstanceOf(AccessDeniedException.class);
    }

    // ── Status guard: cannot transition from wrong state ────────────────────

    @Test
    void cannotSubmit_whenAlreadyPendingManagerReview() {
        workflowService.submit(projectTest.getId(), TECH_ID, "TECHNICIAN", null);
        assertThatThrownBy(() -> workflowService.submit(projectTest.getId(), TECH_ID, "TECHNICIAN", null))
                .isInstanceOf(InvalidWorkflowTransitionException.class);
    }

    @Test
    void cannotManagerApprove_whenNotPendingManagerReview() {
        assertThatThrownBy(() -> workflowService.managerApprove(projectTest.getId(), LM_ID, "LAB_MANAGER", null))
                .isInstanceOf(InvalidWorkflowTransitionException.class);
    }

    @Test
    void cannotPmApprove_whenNotPendingPmReview() {
        workflowService.submit(projectTest.getId(), TECH_ID, "TECHNICIAN", null);
        assertThatThrownBy(() -> workflowService.pmApprove(projectTest.getId(), PM_ID, "PROJECT_MANAGER", null))
                .isInstanceOf(InvalidWorkflowTransitionException.class);
    }

    // ── Active / completed lists ─────────────────────────────────────────────

    @Test
    void technicianActive_includesInProgressAndRejected() {
        // IN_PROGRESS: visible
        assertThat(workflowService.getActive(TECH_ID, "TECHNICIAN"))
                .anyMatch(t -> t.id().equals(projectTest.getId()));

        // After submit → no longer in tech active
        workflowService.submit(projectTest.getId(), TECH_ID, "TECHNICIAN", null);
        assertThat(workflowService.getActive(TECH_ID, "TECHNICIAN"))
                .noneMatch(t -> t.id().equals(projectTest.getId()));

        // After manager rejects → back in tech active
        workflowService.managerReject(projectTest.getId(), LM_ID, "LAB_MANAGER", null);
        assertThat(workflowService.getActive(TECH_ID, "TECHNICIAN"))
                .anyMatch(t -> t.id().equals(projectTest.getId()));
    }

    @Test
    void technicianCompleted_includesPendingReviewAndApproved() {
        workflowService.submit(projectTest.getId(), TECH_ID, "TECHNICIAN", null);
        assertThat(workflowService.getCompleted(TECH_ID, "TECHNICIAN"))
                .anyMatch(t -> t.id().equals(projectTest.getId()));
    }

    @Test
    void labManagerActive_seesTestAfterTechSubmits() {
        workflowService.submit(projectTest.getId(), TECH_ID, "TECHNICIAN", null);
        assertThat(workflowService.getActive(LM_ID, "LAB_MANAGER"))
                .anyMatch(t -> t.id().equals(projectTest.getId()));
    }

    @Test
    void pmActive_seesTestAfterManagerApproves() {
        workflowService.submit(projectTest.getId(), TECH_ID, "TECHNICIAN", null);
        workflowService.managerApprove(projectTest.getId(), LM_ID, "LAB_MANAGER", null);
        assertThat(workflowService.getActive(PM_ID, "PROJECT_MANAGER"))
                .anyMatch(t -> t.id().equals(projectTest.getId()));
    }

    // ── Comment thread immutability and visibility ───────────────────────────

    @Test
    void commentThread_containsAllActionsInChronologicalOrder() {
        workflowService.submit(projectTest.getId(), TECH_ID, "TECHNICIAN", "First submission");
        workflowService.managerReject(projectTest.getId(), LM_ID, "LAB_MANAGER", "Missing data");
        workflowService.submit(projectTest.getId(), TECH_ID, "TECHNICIAN", "Corrected");
        workflowService.managerApprove(projectTest.getId(), LM_ID, "LAB_MANAGER", "OK now");
        workflowService.pmApprove(projectTest.getId(), PM_ID, "PROJECT_MANAGER", "Final OK");

        var comments = workflowService.getComments(projectTest.getId());
        assertThat(comments).hasSize(5);
        assertThat(comments.get(0).action()).isEqualTo("SUBMITTED");
        assertThat(comments.get(1).action()).isEqualTo("MANAGER_REJECTED");
        assertThat(comments.get(2).action()).isEqualTo("SUBMITTED");
        assertThat(comments.get(3).action()).isEqualTo("MANAGER_APPROVED");
        assertThat(comments.get(4).action()).isEqualTo("PM_APPROVED");
    }

    @Test
    void statusHistory_tracksEveryTransitionWithCorrectFromTo() {
        workflowService.submit(projectTest.getId(), TECH_ID, "TECHNICIAN", null);
        workflowService.managerApprove(projectTest.getId(), LM_ID, "LAB_MANAGER", null);

        var history = historyRepo.findByProjectTestIdOrderByChangedAtAsc(projectTest.getId());
        assertThat(history).hasSize(2);
        assertThat(history.get(0).getFromStatus()).isEqualTo(WorkflowStatus.IN_PROGRESS);
        assertThat(history.get(0).getToStatus()).isEqualTo(WorkflowStatus.PENDING_MANAGER_REVIEW);
        assertThat(history.get(1).getFromStatus()).isEqualTo(WorkflowStatus.PENDING_MANAGER_REVIEW);
        assertThat(history.get(1).getToStatus()).isEqualTo(WorkflowStatus.PENDING_PM_REVIEW);
    }
}
