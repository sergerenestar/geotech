package com.lab.geotech.testPs;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lab.geotech.testPs.constant.TestStatus;
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
import org.springframework.test.context.TestPropertySource;
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

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(locations = "classpath:application-test.properties")
class PsTestControllerTest {

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
        jdbcTemplate.execute("DELETE FROM test_ps.ps_hydrometer_readings");
        jdbcTemplate.execute("DELETE FROM test_ps.ps_sieve_results");
        jdbcTemplate.execute("DELETE FROM test_ps.ps_tests");
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

    /**
     * Builds the ASTM D-422 test dataset from the spec:
     * M_total = 500.0g, sieve-only test.
     * Expected: pct_gravel≈9.0%, pct_fines≈15.0%, pct_sand≈76.0%
     */
    private Map<String, Object> buildSieveTestPayload(UUID sampleId) {
        return Map.of(
                "sampleId", sampleId != null ? sampleId.toString() : UUID.randomUUID().toString(),
                "projectId", UUID.randomUUID().toString(),
                "boreholeId", UUID.randomUUID().toString(),
                "testType", "SIEVE",
                "totalDryMassG", 500.0,
                "specificGravity", 2.70,
                "notes", "ASTM D-422 test dataset",
                "sieveResults", List.of(
                        Map.of("sieveLabel", "No. 4",   "openingMm", 4.75,  "massRetainedG", 45.0),
                        Map.of("sieveLabel", "No. 10",  "openingMm", 2.00,  "massRetainedG", 63.0),
                        Map.of("sieveLabel", "No. 40",  "openingMm", 0.425, "massRetainedG", 142.0),
                        Map.of("sieveLabel", "No. 200", "openingMm", 0.075, "massRetainedG", 175.0),
                        Map.of("sieveLabel", "Pan",     "openingMm", 0.001, "massRetainedG", 75.0)
                )
        );
    }

    // -----------------------------------------------------------------------
    // Test 1: Create sieve test — returns 201 with correct pct_finer values
    // -----------------------------------------------------------------------
    @Test
    void createSieveTest_returns201WithCalculatedValues() throws Exception {
        String token = jwt(technicianId, "USER");
        Map<String, Object> body = buildSieveTestPayload(null);

        mockMvc.perform(post("/api/tests/particle-size")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.testType").value("SIEVE"))
                .andExpect(jsonPath("$.totalDryMassG").value(500.0))
                // Fractions: pct_gravel≈9.0, pct_fines≈15.0, pct_sand≈76.0
                .andExpect(jsonPath("$.pctGravel").value(closeTo(9.0, 0.5)))
                .andExpect(jsonPath("$.pctFines").value(closeTo(15.0, 0.5)))
                .andExpect(jsonPath("$.pctSand").value(closeTo(76.0, 0.5)))
                .andExpect(jsonPath("$.sieveResults", hasSize(5)))
                .andExpect(jsonPath("$.aiFlag").value("NONE"));
    }

    // -----------------------------------------------------------------------
    // Test 2: Verify pct_finer calculations match ASTM D-422 spec values
    // -----------------------------------------------------------------------
    @Test
    void createSieveTest_pctFinerValuesMatchSpec() throws Exception {
        String token = jwt(technicianId, "USER");
        Map<String, Object> body = buildSieveTestPayload(null);

        mockMvc.perform(post("/api/tests/particle-size")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated())
                // Sieves sorted descending by openingMm: No.4, No.10, No.40, No.200, Pan
                // pct_finer: No.4=91.0, No.10=78.4, No.40=50.0, No.200=15.0, Pan=0.0
                .andExpect(jsonPath("$.sieveResults[?(@.sieveLabel=='No. 4')].pctFiner")
                        .value(hasItem(closeTo(91.0, 0.5))))
                .andExpect(jsonPath("$.sieveResults[?(@.sieveLabel=='No. 10')].pctFiner")
                        .value(hasItem(closeTo(78.4, 0.5))))
                .andExpect(jsonPath("$.sieveResults[?(@.sieveLabel=='No. 40')].pctFiner")
                        .value(hasItem(closeTo(50.0, 0.5))))
                .andExpect(jsonPath("$.sieveResults[?(@.sieveLabel=='No. 200')].pctFiner")
                        .value(hasItem(closeTo(15.0, 0.5))));
    }

    // -----------------------------------------------------------------------
    // Test 3: Get by ID — returns 200 with correct data
    // -----------------------------------------------------------------------
    @Test
    void getById_existingTest_returns200() throws Exception {
        String token = jwt(technicianId, "USER");
        Map<String, Object> body = buildSieveTestPayload(null);

        String createResponse = mockMvc.perform(post("/api/tests/particle-size")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String id = objectMapper.readTree(createResponse).get("id").asText();

        mockMvc.perform(get("/api/tests/particle-size/" + id)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id))
                .andExpect(jsonPath("$.testType").value("SIEVE"))
                .andExpect(jsonPath("$.sieveResults", hasSize(5)));
    }

    // -----------------------------------------------------------------------
    // Test 4: Get by ID — non-existing returns 404
    // -----------------------------------------------------------------------
    @Test
    void getById_nonExisting_returns404() throws Exception {
        String token = jwt(technicianId, "USER");

        mockMvc.perform(get("/api/tests/particle-size/" + UUID.randomUUID())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"));
    }

    // -----------------------------------------------------------------------
    // Test 5: Valid status transition DRAFT→PENDING_REVIEW returns 200
    // -----------------------------------------------------------------------
    @Test
    void updateStatus_validTransition_returns200() throws Exception {
        String token = jwt(technicianId, "USER");
        Map<String, Object> body = buildSieveTestPayload(null);

        String createResponse = mockMvc.perform(post("/api/tests/particle-size")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String id = objectMapper.readTree(createResponse).get("id").asText();

        // DRAFT → PENDING_REVIEW is a valid transition
        mockMvc.perform(patch("/api/tests/particle-size/" + id + "/status")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("status", "PENDING_REVIEW"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING_REVIEW"));
    }

    // -----------------------------------------------------------------------
    // Test 6: Invalid status transition DRAFT→APPROVED returns 400
    // -----------------------------------------------------------------------
    @Test
    void updateStatus_invalidTransition_returns400() throws Exception {
        String token = jwt(technicianId, "USER");
        Map<String, Object> body = buildSieveTestPayload(null);

        String createResponse = mockMvc.perform(post("/api/tests/particle-size")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String id = objectMapper.readTree(createResponse).get("id").asText();

        // DRAFT → APPROVED is invalid (must go through PENDING_REVIEW)
        mockMvc.perform(patch("/api/tests/particle-size/" + id + "/status")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("status", "APPROVED"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_STATUS_TRANSITION"));
    }

    // -----------------------------------------------------------------------
    // Test 7: Get by sampleId — returns list with correct entry
    // -----------------------------------------------------------------------
    @Test
    void getBySampleId_returns200WithMatchingTests() throws Exception {
        String token = jwt(technicianId, "USER");
        UUID sampleId = UUID.randomUUID();
        Map<String, Object> body = buildSieveTestPayload(sampleId);

        mockMvc.perform(post("/api/tests/particle-size")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/tests/particle-size")
                        .param("sampleId", sampleId.toString())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].sampleId").value(sampleId.toString()));
    }

    // -----------------------------------------------------------------------
    // Test 8: Internal endpoint — latest by sampleId (no auth required)
    // -----------------------------------------------------------------------
    @Test
    void internalEndpoint_getLatestBySample_returns200() throws Exception {
        String token = jwt(technicianId, "USER");
        UUID sampleId = UUID.randomUUID();
        Map<String, Object> body = buildSieveTestPayload(sampleId);

        mockMvc.perform(post("/api/tests/particle-size")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated());

        // Internal endpoint — no Bearer token needed
        mockMvc.perform(get("/internal/particle-size/" + sampleId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sampleId").value(sampleId.toString()))
                .andExpect(jsonPath("$.testType").value("SIEVE"));
    }

    // -----------------------------------------------------------------------
    // Test 9: Create without token — returns 401
    // -----------------------------------------------------------------------
    @Test
    void createTest_withoutToken_returns401() throws Exception {
        Map<String, Object> body = buildSieveTestPayload(null);

        mockMvc.perform(post("/api/tests/particle-size")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isUnauthorized());
    }

    // -----------------------------------------------------------------------
    // Test 10: Create with missing required field — returns 400
    // -----------------------------------------------------------------------
    @Test
    void createTest_missingTotalDryMass_returns400() throws Exception {
        String token = jwt(technicianId, "USER");
        Map<String, Object> body = Map.of(
                "testType", "SIEVE",
                "sieveResults", List.of(
                        Map.of("sieveLabel", "No. 4", "openingMm", 4.75, "massRetainedG", 45.0)
                )
                // totalDryMassG is missing — @NotNull validation should trigger
        );

        mockMvc.perform(post("/api/tests/particle-size")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isBadRequest());
    }
}
