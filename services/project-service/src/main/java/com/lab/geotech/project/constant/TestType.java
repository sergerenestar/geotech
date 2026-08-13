package com.lab.geotech.project.constant;

/**
 * Catalogue of geotechnical test types offered by the laboratory.
 *
 * Each value corresponds to exactly one test microservice that owns the result data.
 * The string name is persisted in the {@code project_tests.test_type} column and is also
 * used as path segments in the web front-end (e.g. {@code /tests/water-content}).
 *
 * ASTM references (current sprint status in parentheses):
 * <ul>
 *   <li>WATER_CONTENT          — D-2216   (Sprint 2, implemented)</li>
 *   <li>LIQUID_LIMIT           — D-4318   (Sprint 3)</li>
 *   <li>PARTICLE_SIZE          — D-422    (Sprint 3)</li>
 *   <li>PROCTOR                — D-698 / D-1557  (Sprint 4)</li>
 *   <li>SPECIFIC_GRAVITY       — D-854    (Sprint 4)</li>
 *   <li>UNCONFINED_COMPRESSION — D-2166   (Sprint 5)</li>
 *   <li>DIRECT_SHEAR           — D-3080   (Sprint 5)</li>
 *   <li>CBR                    — NF P94-078 (Sprint 5)</li>
 *   <li>PERMEABILITY           — D-2434   (Sprint 5)</li>
 *   <li>CONSOLIDATION          — D-2435   (Sprint 5)</li>
 * </ul>
 */
public enum TestType {
    WATER_CONTENT,
    LIQUID_LIMIT,
    PARTICLE_SIZE,
    PROCTOR,
    SPECIFIC_GRAVITY,
    UNCONFINED_COMPRESSION,
    DIRECT_SHEAR,
    CBR,
    PERMEABILITY,
    CONSOLIDATION
}
