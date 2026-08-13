package com.lab.geotech.project.service;

import com.lab.geotech.project.constant.WorkflowStatus;
import com.lab.geotech.project.dto.TestCommentResponse;
import com.lab.geotech.project.dto.TestStatusHistoryResponse;
import com.lab.geotech.project.dto.TestWorkflowResponse;
import com.lab.geotech.project.entity.ProjectTest;
import com.lab.geotech.project.entity.TestComment;
import com.lab.geotech.project.entity.TestStatusHistory;
import com.lab.geotech.project.exception.InvalidWorkflowTransitionException;
import com.lab.geotech.project.exception.ResourceNotFoundException;
import com.lab.geotech.project.repository.ProjectRepository;
import com.lab.geotech.project.repository.ProjectTestRepository;
import com.lab.geotech.project.repository.TestCommentRepository;
import com.lab.geotech.project.repository.TestStatusHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Orchestrates the three-tier test review workflow.
 *
 * <p>The workflow is enforced by three layers of validation on every mutating action:
 * <ol>
 *   <li><b>Role check</b> — caller must hold the role expected at this stage
 *       (technician, lab manager, or project manager).</li>
 *   <li><b>Identity check</b> — the caller must be the specific person assigned to this test
 *       (not just any user with the right role).</li>
 *   <li><b>Status check</b> — the test must be in one of the allowed states for the action.</li>
 * </ol>
 *
 * <p>Every successful transition writes two records atomically:
 * <ul>
 *   <li>A {@code TestStatusHistory} row capturing the from/to states and who changed it.</li>
 *   <li>A {@code TestComment} row recording the action label and any free-text notes.</li>
 * </ul>
 *
 * <p>Query methods ({@code getActive}, {@code getCompleted}) return role-scoped lists so each
 * actor sees only the tests relevant to their current queue.
 */
@Service
@RequiredArgsConstructor
public class TestWorkflowService {

    private final ProjectTestRepository testRepo;
    private final ProjectRepository projectRepo;
    private final TestStatusHistoryRepository historyRepo;
    private final TestCommentRepository commentRepo;

    // ── Technician: submit ──────────────────────────────────────────────────

    /**
     * Technician submits a completed test for lab-manager review.
     * Allowed from: ASSIGNED, IN_PROGRESS, REJECTED_TO_TECH.
     */
    @Transactional
    public TestWorkflowResponse submit(UUID testId, UUID userId, String role, String notes) {
        ProjectTest pt = findTest(testId);
        requireTechnician(pt, userId);
        requireStatus(pt, WorkflowStatus.IN_PROGRESS, WorkflowStatus.ASSIGNED, WorkflowStatus.REJECTED_TO_TECH);

        return transition(pt, WorkflowStatus.PENDING_MANAGER_REVIEW, userId, role, "SUBMITTED", notes);
    }

    // ── Manager: approve / reject ───────────────────────────────────────────

    /**
     * Lab manager approves a submitted test, forwarding it to the project manager.
     * Also handles re-approval of a test that was previously rejected by the PM.
     * Allowed from: PENDING_MANAGER_REVIEW, REJECTED_TO_MANAGER.
     */
    @Transactional
    public TestWorkflowResponse managerApprove(UUID testId, UUID userId, String role, String notes) {
        ProjectTest pt = findTest(testId);
        requireLabManager(pt, userId);
        requireStatus(pt, WorkflowStatus.PENDING_MANAGER_REVIEW, WorkflowStatus.REJECTED_TO_MANAGER);

        return transition(pt, WorkflowStatus.PENDING_PM_REVIEW, userId, role, "MANAGER_APPROVED", notes);
    }

    /**
     * Lab manager rejects a test, returning it to the technician for correction.
     * Allowed from: PENDING_MANAGER_REVIEW, REJECTED_TO_MANAGER.
     */
    @Transactional
    public TestWorkflowResponse managerReject(UUID testId, UUID userId, String role, String notes) {
        ProjectTest pt = findTest(testId);
        requireLabManager(pt, userId);
        requireStatus(pt, WorkflowStatus.PENDING_MANAGER_REVIEW, WorkflowStatus.REJECTED_TO_MANAGER);

        return transition(pt, WorkflowStatus.REJECTED_TO_TECH, userId, role, "MANAGER_REJECTED", notes);
    }

    // ── Project Manager: approve / reject ──────────────────────────────────

    /**
     * Project manager gives final approval — terminal success state.
     * Allowed from: PENDING_PM_REVIEW only.
     */
    @Transactional
    public TestWorkflowResponse pmApprove(UUID testId, UUID userId, String role, String notes) {
        ProjectTest pt = findTest(testId);
        requireProjectManager(pt, userId);
        requireStatus(pt, WorkflowStatus.PENDING_PM_REVIEW);

        return transition(pt, WorkflowStatus.APPROVED, userId, role, "PM_APPROVED", notes);
    }

    /**
     * Project manager rejects the test, returning it to the lab manager for re-review.
     * Allowed from: PENDING_PM_REVIEW only.
     */
    @Transactional
    public TestWorkflowResponse pmReject(UUID testId, UUID userId, String role, String notes) {
        ProjectTest pt = findTest(testId);
        requireProjectManager(pt, userId);
        requireStatus(pt, WorkflowStatus.PENDING_PM_REVIEW);

        return transition(pt, WorkflowStatus.REJECTED_TO_MANAGER, userId, role, "PM_REJECTED", notes);
    }

    // ── Queries ─────────────────────────────────────────────────────────────

    /**
     * Returns the tests currently awaiting action from the calling user.
     *
     * <ul>
     *   <li>TECHNICIAN — tests assigned/in-progress/returned to them.</li>
     *   <li>LAB_MANAGER — tests pending their review or returned from PM.</li>
     *   <li>PROJECT_MANAGER — tests awaiting their final sign-off.</li>
     * </ul>
     *
     * Comments and history threads are omitted for list performance ({@code fromNoThread}).
     */
    @Transactional(readOnly = true)
    public List<TestWorkflowResponse> getActive(UUID userId, String role) {
        List<ProjectTest> tests = switch (role) {
            case "TECHNICIAN" -> testRepo.findByTechnicianIdAndWorkflowStatusIn(
                    userId, List.of(WorkflowStatus.ASSIGNED, WorkflowStatus.IN_PROGRESS, WorkflowStatus.REJECTED_TO_TECH));
            case "LAB_MANAGER" -> testRepo.findByLabManagerIdAndWorkflowStatusIn(
                    userId, List.of(WorkflowStatus.PENDING_MANAGER_REVIEW, WorkflowStatus.REJECTED_TO_MANAGER));
            case "PROJECT_MANAGER" -> testRepo.findByPmAndWorkflowStatusIn(
                    userId, List.of(WorkflowStatus.PENDING_PM_REVIEW));
            default -> List.of();
        };
        return tests.stream().map(TestWorkflowResponse::fromNoThread).toList();
    }

    /**
     * Returns tests where the calling user's action is complete (submitted or approved).
     * Used to populate the "completed" tab in the workflow dashboard.
     */
    @Transactional(readOnly = true)
    public List<TestWorkflowResponse> getCompleted(UUID userId, String role) {
        List<ProjectTest> tests = switch (role) {
            case "TECHNICIAN" -> testRepo.findByTechnicianIdAndWorkflowStatusIn(
                    userId, List.of(WorkflowStatus.PENDING_MANAGER_REVIEW, WorkflowStatus.PENDING_PM_REVIEW, WorkflowStatus.APPROVED));
            case "LAB_MANAGER" -> testRepo.findByLabManagerIdAndWorkflowStatusIn(
                    userId, List.of(WorkflowStatus.PENDING_PM_REVIEW, WorkflowStatus.APPROVED));
            case "PROJECT_MANAGER" -> testRepo.findByPmAndWorkflowStatusIn(
                    userId, List.of(WorkflowStatus.APPROVED));
            default -> List.of();
        };
        return tests.stream().map(TestWorkflowResponse::fromNoThread).toList();
    }

    /** Returns the full comment thread for a test in chronological order. */
    @Transactional(readOnly = true)
    public List<TestCommentResponse> getComments(UUID testId) {
        requireVisible(testId);
        return commentRepo.findByProjectTestIdOrderByCreatedAtAsc(testId).stream()
                .map(TestCommentResponse::from)
                .toList();
    }

    // ── Internal helpers ────────────────────────────────────────────────────

    /**
     * Core state-machine step: updates the workflow status, persists an audit history record,
     * and appends a comment, then returns the full updated response including the thread.
     *
     * @param pt     The test being transitioned.
     * @param target The new workflow status.
     * @param action A machine-readable label stored on the comment (e.g. "SUBMITTED").
     * @param notes  Free-text note from the actor (may be null).
     */
    private TestWorkflowResponse transition(
            ProjectTest pt, WorkflowStatus target,
            UUID userId, String role, String action, String notes) {

        WorkflowStatus previous = pt.getWorkflowStatus();

        pt.setWorkflowStatus(target);
        testRepo.save(pt);

        historyRepo.save(TestStatusHistory.builder()
                .projectTestId(pt.getId())
                .fromStatus(previous)
                .toStatus(target)
                .changedBy(userId)
                .role(role)
                .build());

        commentRepo.save(TestComment.builder()
                .projectTestId(pt.getId())
                .userId(userId)
                .role(role)
                .action(action)
                .comment(notes)
                .build());

        List<TestCommentResponse> comments = commentRepo
                .findByProjectTestIdOrderByCreatedAtAsc(pt.getId()).stream()
                .map(TestCommentResponse::from).toList();
        List<TestStatusHistoryResponse> history = historyRepo
                .findByProjectTestIdOrderByChangedAtAsc(pt.getId()).stream()
                .map(TestStatusHistoryResponse::from).toList();

        return TestWorkflowResponse.from(pt, comments, history);
    }

    private ProjectTest findTest(UUID testId) {
        return testRepo.findById(testId)
                .orElseThrow(() -> new ResourceNotFoundException("ProjectTest not found: " + testId));
    }

    /** Verifies that the caller is the technician assigned to this specific test. */
    private void requireTechnician(ProjectTest pt, UUID userId) {
        if (!userId.equals(pt.getTechnicianId())) {
            throw new AccessDeniedException("Only the assigned technician may perform this action");
        }
    }

    /** Verifies that the caller is the lab manager assigned to this specific test. */
    private void requireLabManager(ProjectTest pt, UUID userId) {
        if (!userId.equals(pt.getLabManagerId())) {
            throw new AccessDeniedException("Only the assigned lab manager may perform this action");
        }
    }

    /**
     * Verifies that the caller is the project manager of the owning project.
     * PM identity is derived from {@code Project.createdBy} (not the denormalised {@code pmId}).
     */
    private void requireProjectManager(ProjectTest pt, UUID userId) {
        var project = projectRepo.findById(pt.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + pt.getProjectId()));
        if (!userId.equals(project.getCreatedBy())) {
            throw new AccessDeniedException("Only the project manager may perform this action");
        }
    }

    /** Throws {@link InvalidWorkflowTransitionException} if the test is not in one of the allowed states. */
    private void requireStatus(ProjectTest pt, WorkflowStatus... allowed) {
        for (WorkflowStatus s : allowed) {
            if (pt.getWorkflowStatus() == s) return;
        }
        throw new InvalidWorkflowTransitionException(pt.getWorkflowStatus(), allowed[0]);
    }

    // Existence check — any call on a test visible to the API consumer
    private void requireVisible(UUID testId) {
        if (!testRepo.existsById(testId)) {
            throw new ResourceNotFoundException("ProjectTest not found: " + testId);
        }
    }
}
