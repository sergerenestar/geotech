package com.lab.geotech.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lab.geotech.auth.constant.Role;
import com.lab.geotech.auth.constant.UserStatus;
import com.lab.geotech.auth.dto.LoginRequest;
import com.lab.geotech.auth.dto.RegisterRequest;
import com.lab.geotech.auth.entity.User;
import com.lab.geotech.auth.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository userRepository;
    @Autowired BCryptPasswordEncoder passwordEncoder;

    @BeforeEach
    void setup() {
        userRepository.deleteAll();
    }

    @Test
    void register_returns201() throws Exception {
        RegisterRequest req = new RegisterRequest("Jean", "Dupont", "jean@lab.com", "password123", null);
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.email").value("jean@lab.com"))
                .andExpect(jsonPath("$.data.status").value("PENDING"));
    }

    @Test
    void register_duplicateEmail_returns409() throws Exception {
        RegisterRequest req = new RegisterRequest("Jean", "Dupont", "dup@lab.com", "password123", null);
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req))).andReturn();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isConflict());
    }

    @Test
    void login_pendingUser_returns403() throws Exception {
        createUser("pending@lab.com", "password123", UserStatus.PENDING);
        LoginRequest req = new LoginRequest("pending@lab.com", "password123");
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }

    @Test
    void login_wrongPassword_returns401() throws Exception {
        createUser("active@lab.com", "password123", UserStatus.ACTIVE);
        LoginRequest req = new LoginRequest("active@lab.com", "wrongpassword");
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void login_validCredentials_returns200WithTokens() throws Exception {
        createUser("active@lab.com", "password123", UserStatus.ACTIVE);
        LoginRequest req = new LoginRequest("active@lab.com", "password123");
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.data.refreshToken").isNotEmpty())
                .andReturn();

        assertThat(result.getResponse().getContentAsString()).contains("accessToken");
    }

    @Test
    void me_withoutToken_returns401() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void refresh_invalidToken_returns401() throws Exception {
        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"not-a-real-token\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void adminEndpoint_withoutAdminRole_returns403() throws Exception {
        createUser("user@lab.com", "password123", UserStatus.ACTIVE);
        LoginRequest req = new LoginRequest("user@lab.com", "password123");
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req))).andReturn();

        String body = loginResult.getResponse().getContentAsString();
        String accessToken = objectMapper.readTree(body).at("/data/accessToken").asText();

        mockMvc.perform(get("/api/auth/users")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isForbidden());
    }

    private User createUser(String email, String rawPassword, UserStatus status) {
        User user = User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(rawPassword))
                .firstName("Test")
                .lastName("User")
                .role(Role.USER)
                .status(status)
                .language("fr")
                .build();
        return userRepository.save(user);
    }
}
