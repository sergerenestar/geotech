package com.lab.geotech.testLl;

import com.fasterxml.jackson.databind.ObjectMapper;
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
class LlTestControllerTest {

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
        jdbcTemplate.execute("DELETE FROM test_ll.ll_casagrande_points");
        jdbcTemplate.execute("DELETE FROM test_ll.ll_pl_determinations");
        jdbcTemplate.execute("DELETE FROM test_ll.ll_tests");
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
     * Builds a standard MULTI_POINT create payload using the ASTM D-4318 spec dataset.
     *
     * Casagrande points:
     *   Pt1: blows=31, container=5.0, wet+cont=33.84, dry+cont=25.0 → w% ≈ 44.200%
     *   Pt2: blows=24, container=5.0, wet+cont=34.70, dry+cont=25.0 → w% ≈ 48.500%
     *   Pt3: blows=18, container=5.0, wet+cont=35.42, dry+cont=25.0 → w% ≈ 52.100%
     * Expected LL ≈ 48%
     *
     * PL determinations:
     *   Det1: container=5.12, wet+cont=12.34, dry+cont=11.18 → w% ≈ 19.178%
     *   Det2: container=4.89, wet+cont=11.56, dry+cont=10.47 → w% ≈ 19.454% (corrected)
     * Average PL ≈ 20.0%
     * PI = LL - PL ≈ 28% → USCS: CL
     */
    private Map<String, Object> buildStandardPayload(UUID sampleId) {
        return Map.of(
                "sampleId", sampleId.toString(),
                "projectId", UUID.randomUUID().toString(),
                "boreholeId", UUID.randomUUID().toString(),
                "method", "MULTI_POINT",
                "notes", "ASTM D-4318 spec dataset",
                "casagrandePoints", List.of(
                        Map.of("blowCount", 31,
                               "massContainerG", 5.0,
                               "massContainerWetSoilG", 33.84,
                               "massContainerDrySoilG", 25.0),
                        Map.of("blowCount", 24,
                               "massContainerG", 5.0,
                               "massContainerWetSoilG", 34.70,
                               "massContainerDrySoilG", 25.0),
                        Map.of("blowCount", 18,
                               "massContainerG", 5.0,
                               "massContainerWetSoilG", 35.42,
                               "massContainerDrySoilG", 25.0)
                ),
                "plDeterminations", List.of(
                        Map.of("massContainerG", 5.12,
                               "massContainerWetSoilG", 12.34,
                               "massContainerDrySoilG", 11.18),
                        Map.of("massContainerG", 4.89,
                               "massContainerWetSoilG", 11.56,
                               "massContainerDrySoilG", 10.47)
                )
        );
    }

    // -------------------------------------------------------------------------
    // Test 1: POST creates test, returns 201 with all calculated values
    // -------------------------------------------------------------------------
    @Test
    void createTest_multiPoint_returns201WithCalculatedLlPlPi() throws Exception {
        String token = jwt(technicianId, "USER");
        UUID sampleId = UUID.randomUUID();

        mockMvc.perform(post("/api/tests/liquid-limit")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildStandardPayload(sampleId))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"))
                .andExpect(jsonPath("$.method").value("MULTI_POINT"))
                .andExpect(jsonPath("$.casagrandePoints", hasSize(3)))
                .andExpect(jsonPath("$.plDeterminations", hasSize(2)))
                // LL should be around 48%
                .andExpect(jsonPath("$.llPct").value(closeTo(48.0, 2.0)))
                // PL should be around 20%
                .andExpect(jsonPath("$.plPct").value(closeTo(20.0, 2.0)))
                // PI = LL - PL
                .andExpect(jsonPath("$.piPct").isNumber())
                // R² should exist and be in valid range
                .andExpect(jsonPath("$.rSquared").isNumber())
                // USCS: CL (lean clay) for this dataset
                .andExpect(jsonPath("$.uscsSymbol").value("CL"))
                // No anomaly expected for this valid dataset
                .andExpect(jsonPath("$.aiFlag").value("NONE"));
    }

    // -------------------------------------------------------------------------
    // Test 2: GET /{id} returns full test
    // -------------------------------------------------------------------------
    @Test
    void getById_existingTest_returns200() throws Exception {
        String token = jwt(technicianId, "USER");
        UUID sampleId = UUID.randomUUID();

        String createResponse = mockMvc.perform(post("/api/tests/liquid-limit")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildStandardPayload(sampleId))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String id = objectMapper.readTree(createResponse).get("id").asText();

        mockMvc.perform(get("/api/tests/liquid-limit/" + id)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id))
                .andExpect(jsonPath("$.casagrandePoints", hasSize(3)))
                .andExpect(jsonPath("$.plDeterminations", hasSize(2)));
    }

    // -------------------------------------------------------------------------
    // Test 3: GET /{id} for unknown id returns 404
    // -------------------------------------------------------------------------
    @Test
    void getById_unknownId_returns404() throws Exception {
        String token = jwt(technicianId, "USER");

        mockMvc.perform(get("/api/tests/liquid-limit/" + UUID.randomUUID())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"));
    }

    // -------------------------------------------------------------------------
    // Test 4: PATCH /{id}/status with valid transition returns 200
    // -------------------------------------------------------------------------
    @Test
    void updateStatus_validTransition_inProgressToPendingReview_returns200() throws Exception {
        String token = jwt(technicianId, "USER");
        UUID sampleId = UUID.randomUUID();

        String createResponse = mockMvc.perform(post("/api/tests/liquid-limit")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildStandardPayload(sampleId))))
                .andReturn().getResponse().getContentAsString();

        String id = objectMapper.readTree(createResponse).get("id").asText();

        mockMvc.perform(patch("/api/tests/liquid-limit/" + id + "/status")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("status", "PENDING_REVIEW"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING_REVIEW"));
    }

    // -------------------------------------------------------------------------
    // Test 5: PATCH /{id}/status with invalid transition returns 400
    // -------------------------------------------------------------------------
    @Test
    void updateStatus_invalidTransition_inProgressToApproved_returns400() throws Exception {
        String token = jwt(technicianId, "USER");
        UUID sampleId = UUID.randomUUID();

        String createResponse = mockMvc.perform(post("/api/tests/liquid-limit")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildStandardPayload(sampleId))))
                .andReturn().getResponse().getContentAsString();

        String id = objectMapper.readTree(createResponse).get("id").asText();

        // IN_PROGRESS → APPROVED is forbidden (must go through PENDING_REVIEW first)
        mockMvc.perform(patch("/api/tests/liquid-limit/" + id + "/status")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("status", "APPROVED"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_STATUS_TRANSITION"));
    }

    // -------------------------------------------------------------------------
    // Test 6: GET /?sampleId returns list of tests for that sample
    // -------------------------------------------------------------------------
    @Test
    void listBySampleId_returnsList() throws Exception {
        String token = jwt(technicianId, "USER");
        UUID sampleId = UUID.randomUUID();

        // Create two tests for the same sampleId
        mockMvc.perform(post("/api/tests/liquid-limit")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildStandardPayload(sampleId))))
                .andExpect(status().isCreated());
        mockMvc.perform(post("/api/tests/liquid-limit")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildStandardPayload(sampleId))))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/tests/liquid-limit")
                        .param("sampleId", sampleId.toString())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].sampleId").value(sampleId.toString()));
    }

    // -------------------------------------------------------------------------
    // Test 7: ONE_POINT method calculates LL using annex formula
    // -------------------------------------------------------------------------
    @Test
    void createTest_onePointMethod_calculatesLlViaAnnexFormula() throws Exception {
        String token = jwt(technicianId, "USER");
        // One-point: LL = w_N * (N/25)^0.121
        // Use N=25 blows, w%=45% → masses: container=5, dry+cont=25 (mDry=20), mWater=20*0.45=9 → wet+cont=34
        // LL = 45 * (25/25)^0.121 = 45 * 1.0 = 45%
        Map<String, Object> body = Map.of(
                "sampleId", UUID.randomUUID().toString(),
                "projectId", UUID.randomUUID().toString(),
                "method", "ONE_POINT",
                "notes", "One-point annex test",
                "casagrandePoints", List.of(
                        Map.of("blowCount", 25,
                               "massContainerG", 5.0,
                               "massContainerWetSoilG", 34.0,
                               "massContainerDrySoilG", 25.0)
                ),
                "plDeterminations", List.of()
        );

        mockMvc.perform(post("/api/tests/liquid-limit")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.method").value("ONE_POINT"))
                // w% = (34-25)/(25-5)*100 = 9/20*100 = 45%
                // LL = 45 * (25/25)^0.121 = 45.0
                .andExpect(jsonPath("$.llPct").value(closeTo(45.0, 0.1)))
                // R² not computed for one-point — field is null
                .andExpect(jsonPath("$.rSquared").value(nullValue()));
    }

    // -------------------------------------------------------------------------
    // Test 8: POST without token returns 401
    // -------------------------------------------------------------------------
    @Test
    void createTest_withoutToken_returns401() throws Exception {
        mockMvc.perform(post("/api/tests/liquid-limit")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildStandardPayload(UUID.randomUUID()))))
                .andExpect(status().isUnauthorized());
    }

    // -------------------------------------------------------------------------
    // Test 9: GET /internal/liquid-limit/{sampleId} returns latest (no auth)
    // -------------------------------------------------------------------------
    @Test
    void internalEndpoint_getLatestBySample_noAuthRequired() throws Exception {
        String token = jwt(technicianId, "USER");
        UUID sampleId = UUID.randomUUID();

        mockMvc.perform(post("/api/tests/liquid-limit")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildStandardPayload(sampleId))))
                .andExpect(status().isCreated());

        // Internal endpoint — no Authorization header required
        mockMvc.perform(get("/internal/liquid-limit/" + sampleId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sampleId").value(sampleId.toString()))
                .andExpect(jsonPath("$.llPct").isNumber());
    }

    // -------------------------------------------------------------------------
    // Test 10: Anomaly WARNING for blow count outside [2, 45]
    // -------------------------------------------------------------------------
    @Test
    void createTest_blowCountOutOfRange_setsWarningFlag() throws Exception {
        String token = jwt(technicianId, "USER");
        // Use blow count = 1 (below minimum of 2) → should set WARNING
        Map<String, Object> body = Map.of(
                "sampleId", UUID.randomUUID().toString(),
                "method", "MULTI_POINT",
                "casagrandePoints", List.of(
                        Map.of("blowCount", 1,
                               "massContainerG", 5.0,
                               "massContainerWetSoilG", 33.84,
                               "massContainerDrySoilG", 25.0),
                        Map.of("blowCount", 24,
                               "massContainerG", 5.0,
                               "massContainerWetSoilG", 34.70,
                               "massContainerDrySoilG", 25.0),
                        Map.of("blowCount", 18,
                               "massContainerG", 5.0,
                               "massContainerWetSoilG", 35.42,
                               "massContainerDrySoilG", 25.0)
                ),
                "plDeterminations", List.of()
        );

        mockMvc.perform(post("/api/tests/liquid-limit")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.aiFlag").value("WARNING"))
                .andExpect(jsonPath("$.aiFlagMessage").value(containsString("Blow count")));
    }
}
