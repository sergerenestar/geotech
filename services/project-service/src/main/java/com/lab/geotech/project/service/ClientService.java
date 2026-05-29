package com.lab.geotech.project.service;

import com.lab.geotech.project.dto.ClientCreateDto;
import com.lab.geotech.project.dto.ClientResponse;
import com.lab.geotech.project.entity.Client;
import com.lab.geotech.project.exception.ResourceNotFoundException;
import com.lab.geotech.project.repository.ClientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ClientService {

    private final ClientRepository clientRepository;

    public Page<ClientResponse> getAll(Pageable pageable) {
        return clientRepository.findAll(pageable).map(ClientResponse::from);
    }

    public ClientResponse getById(UUID id) {
        return clientRepository.findById(id)
                .map(ClientResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("Client", id));
    }

    @Transactional
    public ClientResponse create(ClientCreateDto dto) {
        Client client = Client.builder()
                .name(dto.name())
                .contactPerson(dto.contactPerson())
                .email(dto.email())
                .phone(dto.phone())
                .deleted(false)
                .build();
        return ClientResponse.from(clientRepository.save(client));
    }

    @Transactional
    public void delete(UUID id) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Client", id));
        client.setDeleted(true);
        clientRepository.save(client);
    }
}
