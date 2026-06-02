package com.lab.geotech.project.service;

import com.lab.geotech.project.dto.*;
import com.lab.geotech.project.entity.Client;
import com.lab.geotech.project.entity.ClientNote;
import com.lab.geotech.project.repository.ClientNoteRepository;
import com.lab.geotech.project.repository.ClientRepository;
import com.lab.geotech.project.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ClientService {

    private final ClientRepository clientRepository;
    private final ClientNoteRepository noteRepository;
    private final ProjectRepository projectRepository;

    public List<ClientResponse> getClients() {
        return clientRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(c -> ClientResponse.from(c, projectRepository.countByClientId(c.getId())))
                .toList();
    }

    public ClientResponse getClient(UUID clientId) {
        Client c = clientRepository.findById(clientId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Client not found"));
        return ClientResponse.from(c, projectRepository.countByClientId(clientId));
    }

    @Transactional
    public ClientResponse createClient(UUID createdBy, ClientCreateDto dto) {
        Client c = Client.builder()
                .name(dto.name())
                .type(dto.type() != null ? dto.type() : "PERSON")
                .contactName(dto.contactName())
                .email(dto.email())
                .phone(dto.phone())
                .address(dto.address())
                .notes(dto.notes())
                .createdBy(createdBy)
                .build();
        Client saved = clientRepository.save(c);
        return ClientResponse.from(saved, 0L);
    }

    @Transactional
    public ClientResponse updateClient(UUID clientId, ClientCreateDto dto) {
        Client c = clientRepository.findById(clientId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Client not found"));
        c.setName(dto.name());
        if (dto.type() != null) c.setType(dto.type());
        c.setContactName(dto.contactName());
        c.setEmail(dto.email());
        c.setPhone(dto.phone());
        c.setAddress(dto.address());
        c.setNotes(dto.notes());
        return ClientResponse.from(clientRepository.save(c), projectRepository.countByClientId(clientId));
    }

    public List<ClientNoteResponse> getNotes(UUID projectId) {
        return noteRepository.findByProjectIdOrderByCreatedAtDesc(projectId).stream()
                .map(ClientNoteResponse::from).toList();
    }

    @Transactional
    public ClientNoteResponse addNote(UUID projectId, UUID clientId, ClientNoteCreateDto dto) {
        ClientNote note = ClientNote.builder()
                .projectId(projectId)
                .clientId(clientId)
                .author(dto.author())
                .content(dto.content())
                .build();
        return ClientNoteResponse.from(noteRepository.save(note));
    }
}
