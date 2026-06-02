package com.lab.geotech.project.controller;

import com.lab.geotech.project.dto.*;
import com.lab.geotech.project.exception.ApiResponse;
import com.lab.geotech.project.service.ClientService;
import com.lab.geotech.project.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/clients")
@RequiredArgsConstructor
public class ClientController {

    private final ClientService clientService;
    private final ProjectService projectService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','PROJECT_MANAGER','LAB_MANAGER')")
    public ResponseEntity<ApiResponse<List<ClientResponse>>> list() {
        return ResponseEntity.ok(ApiResponse.success(clientService.getClients(), "OK"));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','PROJECT_MANAGER')")
    public ResponseEntity<ApiResponse<ClientResponse>> create(
            @Valid @RequestBody ClientCreateDto dto,
            @AuthenticationPrincipal String userId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(clientService.createClient(UUID.fromString(userId), dto), "Client created"));
    }

    @GetMapping("/{clientId}")
    @PreAuthorize("hasAnyRole('ADMIN','PROJECT_MANAGER','LAB_MANAGER','CLIENT')")
    public ResponseEntity<ApiResponse<ClientResponse>> get(
            @PathVariable UUID clientId,
            Authentication auth) {
        enforceClientOwnership(clientId, auth);
        return ResponseEntity.ok(ApiResponse.success(clientService.getClient(clientId), "OK"));
    }

    @PatchMapping("/{clientId}")
    @PreAuthorize("hasAnyRole('ADMIN','PROJECT_MANAGER')")
    public ResponseEntity<ApiResponse<ClientResponse>> update(
            @PathVariable UUID clientId,
            @Valid @RequestBody ClientCreateDto dto) {
        return ResponseEntity.ok(ApiResponse.success(clientService.updateClient(clientId, dto), "Updated"));
    }

    @GetMapping("/{clientId}/projects")
    @PreAuthorize("hasAnyRole('ADMIN','PROJECT_MANAGER','LAB_MANAGER','CLIENT')")
    public ResponseEntity<ApiResponse<PagedResponse<ProjectResponse>>> projects(
            @PathVariable UUID clientId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            Authentication auth) {
        enforceClientOwnership(clientId, auth);
        return ResponseEntity.ok(ApiResponse.success(
                projectService.getProjectsByClientId(clientId, page, size), "OK"));
    }

    @GetMapping("/{clientId}/projects/{projectId}/notes")
    @PreAuthorize("hasAnyRole('ADMIN','PROJECT_MANAGER','LAB_MANAGER','CLIENT')")
    public ResponseEntity<ApiResponse<List<ClientNoteResponse>>> getNotes(
            @PathVariable UUID clientId,
            @PathVariable UUID projectId,
            Authentication auth) {
        enforceClientOwnership(clientId, auth);
        return ResponseEntity.ok(ApiResponse.success(clientService.getNotes(projectId), "OK"));
    }

    @PostMapping("/{clientId}/projects/{projectId}/notes")
    @PreAuthorize("hasAnyRole('CLIENT','PROJECT_MANAGER','ADMIN')")
    public ResponseEntity<ApiResponse<ClientNoteResponse>> addNote(
            @PathVariable UUID clientId,
            @PathVariable UUID projectId,
            @Valid @RequestBody ClientNoteCreateDto dto,
            Authentication auth) {
        enforceClientOwnership(clientId, auth);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(clientService.addNote(projectId, clientId, dto), "Note added"));
    }

    private void enforceClientOwnership(UUID clientId, Authentication auth) {
        boolean isClient = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_CLIENT"));
        if (!isClient) return;
        Object details = auth.getDetails();
        if (!(details instanceof Map)) throw new org.springframework.security.access.AccessDeniedException("Access denied");
        String jwtClientId = ((Map<?, ?>) details).get("clientId").toString();
        if (!clientId.toString().equals(jwtClientId)) {
            throw new org.springframework.security.access.AccessDeniedException("Access denied");
        }
    }
}
