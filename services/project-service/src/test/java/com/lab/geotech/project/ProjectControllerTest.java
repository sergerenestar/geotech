package com.lab.geotech.project;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lab.geotech.project.constant.ProjectStatus;
import com.lab.geotech.project.dto.ProjectCreateDto;
import com.lab.geotech.project.dto.ProjectStatusUpdateDto;
import com.lab.geotech.project.entity.Project;
import com.lab.geotech.project.repository.ProjectRepository;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ProjectControllerTest {

    private static final String TEST_SECRET = "test-secret-minimum-256-bits-for-hmac-sha256-algorithm-key-here";
    private static final SecretKey SIGNING_KEY =
            Keys.hmacShaKeyFor(TEST_SECRET.getBytes(StandardCharsets.UTF_8));

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired ProjectRepository projectRepository;
    @Autowired JdbcTemplate jdbcTemplate;

    private static final UUID USER_ID = UUID.randomUUID();

    @BeforeEach
    void setup() {
        jdbcTemplate.execute("DELETE FROM projects.samples");
        jdbcTemplate.execute("DELETE FROM projects.boreholes");
        jdbcTemplate.execute("DELETE FROM projects.projects");
    }

    private String jwtForUser(UUID userId, String role) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(userId.toString())
                .claim("role", role)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(900)))
                .signWith(SIGNING_KEY)
                .compact();
    }

    @Test
    void createProject_returnsCodeInGtFormat() throws Exception {
        ProjectCreateDto dto = new ProjectCreateDto("Site A Test", "Description", null, null);
        MvcResult result = mockMvc.perform(post("/api/projects")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto))
                        .header("Authorization", "Bearer " + jwtForUser(USER_ID, "USER")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.projectCode").isNotEmpty())
                .andReturn();

        String code = objectMapper.readTree(result.getResponse().getContentAsString())
                .at("/data/projectCode").asText();
        assertThat(code).matches("GT-\\d{4}-\\d{4}");
    }

    @Test
    void getMyProjects_returnsOnlyOwnProjects() throws Exception {
        UUID otherId = UUID.randomUUID();
        createProject("Own Project", USER_ID);
        createProject("Other Project", otherId);

        mockMvc.perform(get("/api/projects/mine")
                        .header("Authorization", "Bearer " + jwtForUser(USER_ID, "USER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.data.length()").value(1))
                .andExpect(jsonPath("$.data.data[0].name").value("Own Project"));
    }

    @Test
    void softDelete_notInListButRowSurvives() throws Exception {
        Project project = createProject("To Delete", USER_ID);

        mockMvc.perform(delete("/api/projects/" + project.getId())
                        .header("Authorization", "Bearer " + jwtForUser(USER_ID, "USER")))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/projects/mine")
                        .header("Authorization", "Bearer " + jwtForUser(USER_ID, "USER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.data.length()").value(0));

        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM projects.projects WHERE id = ?",
                Integer.class, project.getId());
        assertThat(count).isEqualTo(1);
    }

    @Test
    void statusTransition_draftToActive_ok() throws Exception {
        Project project = createProject("Status Test", USER_ID);
        ProjectStatusUpdateDto dto = new ProjectStatusUpdateDto(ProjectStatus.ACTIVE);

        mockMvc.perform(patch("/api/projects/" + project.getId() + "/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto))
                        .header("Authorization", "Bearer " + jwtForUser(USER_ID, "USER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("ACTIVE"));
    }

    @Test
    void statusTransition_activeToDraft_returns400() throws Exception {
        Project project = createProject("Status Invalid", USER_ID);
        project.setStatus(ProjectStatus.ACTIVE);
        projectRepository.save(project);

        ProjectStatusUpdateDto dto = new ProjectStatusUpdateDto(ProjectStatus.DRAFT);

        mockMvc.perform(patch("/api/projects/" + project.getId() + "/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto))
                        .header("Authorization", "Bearer " + jwtForUser(USER_ID, "USER")))
                .andExpect(status().isBadRequest());
    }

    private Project createProject(String name, UUID createdBy) {
        Project p = Project.builder()
                .projectCode("GT-2026-" + String.format("%04d", (int)(Math.random() * 9000) + 1000))
                .name(name)
                .status(ProjectStatus.DRAFT)
                .createdBy(createdBy)
                .deleted(false)
                .build();
        return projectRepository.save(p);
    }
}
