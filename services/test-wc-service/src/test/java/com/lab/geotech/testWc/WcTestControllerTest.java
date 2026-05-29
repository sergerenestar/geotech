package com.lab.geotech.testWc;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lab.geotech.testWc.constant.TestStatus;
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

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class WcTestControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired JdbcTemplate jdbcTemplate;

    private static final String TEST_SECRET =
            "test-secret-minimum-256-bits-for-hmac-sha256-algorithm-key-here";
    private static final SecretKey SIGNING_KEY =
            Keys.hmacShaKeyFor(TEST_SECRET.getBytes(StandardCharsets.UTF_8));

    private UUID technicianId;

    @BeforeEach
    void setUp() {
        jdbcTemplate.execute("DELETE FROM test_wc.wc_determinations");
        jdbcTemplate.execute("DELETE FROM test_wc.wc_tests");
        technicianId = UUID.randomUUID();
    }

    private String jwt(UUID userId, String role) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(userId.toString())
                .claim("role", role)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(900)))
                .signWith(SIGNING_KEY)
                .compact();
    }

    private Map<String, Object> buildCreatePayload(double container, double wet, double dry) {
        return Map.of(
                "sampleId", UUID.randomUUID().toString(),
                "projectId", UUID.randomUUID().toString(),
                "boreholeId", UUID.randomUUID().toString(),
                "temperatureC", 22.5,
                "notes", "test run",
                "determinations", List.of(
                        Map.of("massContainerG", container,
                               "massContainerWetSoilG", wet,
                               "massContainerDrySoilG", dry)
                )
        );
    }

    @Test
    void createTest_returns201WithCalculatedValues() throws Exception {
        String token = jwt(technicianId, "USER");
        Map<String, Object> body = buildCreatePayload(50.0, 150.0, 130.0);

        mockMvc.perform(post("/api/tests/water-content")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"))
                .andExpect(jsonPath("$.determinations", hasSize(1)))
                .andExpect(jsonPath("$.determinations[0].massWaterG").value(closeTo(20.0, 0.01)))
                .andExpect(jsonPath("$.determinations[0].massDrySoilG").value(closeTo(80.0, 0.01)))
                .andExpect(jsonPath("$.determinations[0].waterContentPct").value(closeTo(25.0, 0.01)))
                .andExpect(jsonPath("$.averageWaterContentPct").value(closeTo(25.0, 0.01)));
    }

    @Test
    void createTest_withoutToken_returns401() throws Exception {
        Map<String, Object> body = buildCreatePayload(50.0, 150.0, 130.0);
        mockMvc.perform(post("/api/tests/water-content")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void createTest_emptyDeterminations_returns400() throws Exception {
        String token = jwt(technicianId, "USER");
        Map<String, Object> body = Map.of(
                "sampleId", UUID.randomUUID().toString(),
                "determinations", List.of()
        );
        mockMvc.perform(post("/api/tests/water-content")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createTest_anomalyFlaggedForHighWc() throws Exception {
        String token = jwt(technicianId, "USER");
        // w% = (wet-dry)/(dry-container) * 100 = (200-120)/(120-50)*100 = 80/70*100 ≈ 114%
        Map<String, Object> body = buildCreatePayload(50.0, 200.0, 120.0);

        mockMvc.perform(post("/api/tests/water-content")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.aiFlag").value("WARNING"))
                .andExpect(jsonPath("$.aiFlagMessage").value(containsString("100%")));
    }

    @Test
    void getById_existingTest_returns200() throws Exception {
        String token = jwt(technicianId, "USER");
        Map<String, Object> body = buildCreatePayload(50.0, 150.0, 130.0);

        String createResponse = mockMvc.perform(post("/api/tests/water-content")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andReturn().getResponse().getContentAsString();

        String id = objectMapper.readTree(createResponse).get("id").asText();

        mockMvc.perform(get("/api/tests/water-content/" + id)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id));
    }

    @Test
    void getById_nonExisting_returns404() throws Exception {
        String token = jwt(technicianId, "USER");
        mockMvc.perform(get("/api/tests/water-content/" + UUID.randomUUID())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }

    @Test
    void updateStatus_validTransition_returns200() throws Exception {
        String token = jwt(technicianId, "USER");
        Map<String, Object> body = buildCreatePayload(50.0, 150.0, 130.0);

        String createResponse = mockMvc.perform(post("/api/tests/water-content")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andReturn().getResponse().getContentAsString();

        String id = objectMapper.readTree(createResponse).get("id").asText();

        mockMvc.perform(patch("/api/tests/water-content/" + id + "/status")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("status", "PENDING_REVIEW"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING_REVIEW"));
    }

    @Test
    void updateStatus_invalidTransition_returns400() throws Exception {
        String token = jwt(technicianId, "USER");
        Map<String, Object> body = buildCreatePayload(50.0, 150.0, 130.0);

        String createResponse = mockMvc.perform(post("/api/tests/water-content")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andReturn().getResponse().getContentAsString();

        String id = objectMapper.readTree(createResponse).get("id").asText();

        // IN_PROGRESS → APPROVED is not allowed (must go through PENDING_REVIEW)
        mockMvc.perform(patch("/api/tests/water-content/" + id + "/status")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("status", "APPROVED"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_STATUS_TRANSITION"));
    }

    @Test
    void internalEndpoint_getLatestBySample_returns200() throws Exception {
        String token = jwt(technicianId, "USER");
        UUID sampleId = UUID.randomUUID();
        Map<String, Object> body = Map.of(
                "sampleId", sampleId.toString(),
                "determinations", List.of(
                        Map.of("massContainerG", 50.0,
                               "massContainerWetSoilG", 150.0,
                               "massContainerDrySoilG", 130.0)
                )
        );

        mockMvc.perform(post("/api/tests/water-content")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/internal/water-content/" + sampleId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sampleId").value(sampleId.toString()));
    }
}
