package com.lab.geotech.auth.service;

import com.lab.geotech.auth.constant.Role;
import com.lab.geotech.auth.constant.UserStatus;
import com.lab.geotech.auth.dto.AdminNoteResponse;
import com.lab.geotech.auth.dto.CreateUserRequest;
import com.lab.geotech.auth.dto.NoteRequest;
import com.lab.geotech.auth.dto.PagedResponse;
import com.lab.geotech.auth.dto.UpdateUserProfileRequest;
import com.lab.geotech.auth.dto.UserResponse;
import com.lab.geotech.auth.entity.AdminNote;
import com.lab.geotech.auth.entity.User;
import com.lab.geotech.auth.exception.UserNotFoundException;
import com.lab.geotech.auth.repository.AdminNoteRepository;
import com.lab.geotech.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final AdminNoteRepository adminNoteRepository;
    private final AuditService auditService;
    private final BCryptPasswordEncoder passwordEncoder;

    public PagedResponse<UserResponse> getAllUsers(int page, int size, String role, String status) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<User> users;
        if (role != null && status != null) {
            users = userRepository.findAllByRoleAndStatus(
                    Role.valueOf(role), UserStatus.valueOf(status), pageable);
        } else if (role != null) {
            users = userRepository.findAllByRole(Role.valueOf(role), pageable);
        } else if (status != null) {
            users = userRepository.findAllByStatus(UserStatus.valueOf(status), pageable);
        } else {
            users = userRepository.findAll(pageable);
        }
        return PagedResponse.of(
                users.getContent().stream().map(UserResponse::from).toList(),
                users.getTotalElements(), page, size);
    }

    public UserResponse getUserById(UUID id) {
        return UserResponse.from(
                userRepository.findById(id).orElseThrow(() -> new UserNotFoundException(id)));
    }

    @Transactional
    public UserResponse createUser(CreateUserRequest req, UUID adminId) {
        if (userRepository.existsByEmail(req.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already in use");
        }
        User user = User.builder()
                .email(req.email())
                .passwordHash(passwordEncoder.encode(req.password()))
                .firstName(req.firstName())
                .lastName(req.lastName())
                .role(req.role())
                .status(UserStatus.ACTIVE)
                .language("fr")
                .build();
        UserResponse saved = UserResponse.from(userRepository.save(user));
        auditService.log(adminId, "USER_CREATED_BY_ADMIN", "USER", saved.id().toString(),
                Map.of("createdBy", adminId.toString(), "role", req.role().name()), null);
        return saved;
    }

    @Transactional
    public UserResponse updateProfile(UUID id, UpdateUserProfileRequest req, UUID adminId) {
        User user = userRepository.findById(id).orElseThrow(() -> new UserNotFoundException(id));
        user.setFirstName(req.firstName());
        user.setLastName(req.lastName());
        user.setEmail(req.email());
        if (req.contactNumber() != null) user.setContactNumber(req.contactNumber());
        auditService.log(adminId, "USER_PROFILE_UPDATED", "USER", id.toString(),
                Map.of("updatedBy", adminId.toString()), null);
        return UserResponse.from(userRepository.save(user));
    }

    @Transactional
    public void deleteUser(UUID id, UUID adminId) {
        User user = userRepository.findById(id).orElseThrow(() -> new UserNotFoundException(id));
        user.setDeleted(true);
        userRepository.save(user);
        auditService.log(adminId, "USER_DELETED", "USER", id.toString(),
                Map.of("deletedBy", adminId.toString()), null);
    }

    @Transactional
    public UserResponse approveUser(UUID id, UUID adminId) {
        User user = userRepository.findById(id).orElseThrow(() -> new UserNotFoundException(id));
        user.setStatus(UserStatus.ACTIVE);
        auditService.log(adminId, "USER_APPROVED", "USER", id.toString(),
                Map.of("approvedBy", adminId.toString()), null);
        return UserResponse.from(userRepository.save(user));
    }

    @Transactional
    public UserResponse deactivateUser(UUID id, UUID adminId) {
        User user = userRepository.findById(id).orElseThrow(() -> new UserNotFoundException(id));
        user.setStatus(UserStatus.INACTIVE);
        auditService.log(adminId, "USER_DEACTIVATED", "USER", id.toString(),
                Map.of("deactivatedBy", adminId.toString()), null);
        return UserResponse.from(userRepository.save(user));
    }

    @Transactional
    public UserResponse reactivateUser(UUID id, UUID adminId) {
        User user = userRepository.findById(id).orElseThrow(() -> new UserNotFoundException(id));
        user.setStatus(UserStatus.ACTIVE);
        auditService.log(adminId, "USER_REACTIVATED", "USER", id.toString(),
                Map.of("reactivatedBy", adminId.toString()), null);
        return UserResponse.from(userRepository.save(user));
    }

    @Transactional
    public UserResponse updateRole(UUID id, Role newRole, UUID adminId) {
        User user = userRepository.findById(id).orElseThrow(() -> new UserNotFoundException(id));
        Role oldRole = user.getRole();
        user.setRole(newRole);
        auditService.log(adminId, "USER_ROLE_CHANGED", "USER", id.toString(),
                Map.of("from", oldRole.name(), "to", newRole.name(), "changedBy", adminId.toString()), null);
        return UserResponse.from(userRepository.save(user));
    }

    @Transactional
    public UserResponse updateLanguage(UUID id, String language) {
        User user = userRepository.findById(id).orElseThrow(() -> new UserNotFoundException(id));
        user.setLanguage(language);
        return UserResponse.from(userRepository.save(user));
    }

    // --- Admin notes ---

    public List<AdminNoteResponse> getNotes(UUID userId) {
        userRepository.findById(userId).orElseThrow(() -> new UserNotFoundException(userId));
        return adminNoteRepository.findAllByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(AdminNoteResponse::from).toList();
    }

    @Transactional
    public AdminNoteResponse addNote(UUID userId, UUID authorId, NoteRequest req) {
        User author = userRepository.findById(authorId).orElseThrow(() -> new UserNotFoundException(authorId));
        userRepository.findById(userId).orElseThrow(() -> new UserNotFoundException(userId));
        AdminNote note = AdminNote.builder()
                .userId(userId)
                .authorId(authorId)
                .authorHandle(author.getFirstName() + " " + author.getLastName())
                .content(req.content())
                .build();
        return AdminNoteResponse.from(adminNoteRepository.save(note));
    }

    @Transactional
    public AdminNoteResponse updateNote(UUID userId, UUID noteId, UUID authorId, NoteRequest req) {
        AdminNote note = adminNoteRepository.findByIdAndAuthorId(noteId, authorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your note"));
        if (!note.getUserId().equals(userId))
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Note not found");
        note.setContent(req.content());
        return AdminNoteResponse.from(adminNoteRepository.save(note));
    }

    @Transactional
    public void deleteNote(UUID userId, UUID noteId, UUID authorId) {
        AdminNote note = adminNoteRepository.findByIdAndAuthorId(noteId, authorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your note"));
        if (!note.getUserId().equals(userId))
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Note not found");
        adminNoteRepository.delete(note);
    }
}
