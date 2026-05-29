package com.lab.geotech.auth.service;

import com.lab.geotech.auth.constant.Role;
import com.lab.geotech.auth.constant.UserStatus;
import com.lab.geotech.auth.dto.*;
import com.lab.geotech.auth.entity.RefreshToken;
import com.lab.geotech.auth.entity.User;
import com.lab.geotech.auth.exception.*;
import com.lab.geotech.auth.repository.RefreshTokenRepository;
import com.lab.geotech.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtService jwtService;
    private final AuditService auditService;
    private final BCryptPasswordEncoder passwordEncoder;

    @Value("${jwt.refresh.expiration.days:7}")
    private int refreshExpirationDays;

    @Transactional
    public UserResponse register(RegisterRequest req, String ipAddress) {
        if (userRepository.existsByEmail(req.email())) {
            throw new UserAlreadyExistsException(req.email());
        }
        User user = User.builder()
                .email(req.email())
                .passwordHash(passwordEncoder.encode(req.password()))
                .firstName(req.firstName())
                .lastName(req.lastName())
                .contactNumber(req.contactNumber())
                .role(Role.USER)
                .status(UserStatus.PENDING)
                .language("fr")
                .build();
        user = userRepository.save(user);
        auditService.log(user.getId(), "USER_REGISTERED", "USER", user.getId().toString(),
                Map.of("email", user.getEmail()), ipAddress);
        return UserResponse.from(user);
    }

    @Transactional
    public AuthResponse login(LoginRequest req, String ipAddress) {
        User user = userRepository.findByEmail(req.email())
                .orElseThrow(InvalidCredentialsException::new);
        if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            throw new InvalidCredentialsException();
        }
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new UserNotActiveException(user.getStatus().name());
        }
        String rawRefreshToken = jwtService.generateRefreshToken();
        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .tokenHash(jwtService.hashToken(rawRefreshToken))
                .expiresAt(OffsetDateTime.now().plusDays(refreshExpirationDays))
                .build();
        refreshTokenRepository.save(refreshToken);
        auditService.log(user.getId(), "USER_LOGIN", "USER", user.getId().toString(), null, ipAddress);
        return new AuthResponse(jwtService.generateAccessToken(user), rawRefreshToken, UserResponse.from(user));
    }

    @Transactional
    public AuthResponse refresh(String rawRefreshToken) {
        String hash = jwtService.hashToken(rawRefreshToken);
        RefreshToken token = refreshTokenRepository.findByTokenHash(hash)
                .orElseThrow(InvalidTokenException::new);
        if (token.getExpiresAt().isBefore(OffsetDateTime.now())) {
            refreshTokenRepository.delete(token);
            throw new InvalidTokenException();
        }
        User user = token.getUser();
        refreshTokenRepository.delete(token);
        String newRaw = jwtService.generateRefreshToken();
        RefreshToken newToken = RefreshToken.builder()
                .user(user)
                .tokenHash(jwtService.hashToken(newRaw))
                .expiresAt(OffsetDateTime.now().plusDays(refreshExpirationDays))
                .build();
        refreshTokenRepository.save(newToken);
        return new AuthResponse(jwtService.generateAccessToken(user), newRaw, UserResponse.from(user));
    }

    @Transactional
    public void logout(String rawRefreshToken) {
        String hash = jwtService.hashToken(rawRefreshToken);
        refreshTokenRepository.findByTokenHash(hash).ifPresent(refreshTokenRepository::delete);
    }

    public UserResponse getCurrentUser(UUID userId) {
        return userRepository.findById(userId)
                .map(UserResponse::from)
                .orElseThrow(() -> new UserNotFoundException(userId));
    }
}
