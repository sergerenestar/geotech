// src/main/java/com/saker/geotech/config/OpenApiConfig.java
package com.saker.geotech.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * ███████ OPENAPI (SWAGGER) CONFIGURATION ███████
 *
 * Configures Swagger UI / OpenAPI 3 documentation for the entire GeotechLab API.
 * Accessible at: http://localhost:8080/swagger-ui.html
 * Perfect for testing particle-size test endpoints, project CRUD, report generation, etc.
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Saker GeoTech Lab – Geotechnical Laboratory Management API")
                        .version("1.0.0")
                        .description("""
                                Spring Boot REST API for the complete geotechnical laboratory workflow:
                                • Projects → Boreholes → Samples → All test types (GNT, S-A-R, Water Content, Proctor, CBR, ...)
                                • Automatic calculations & curve generation
                                • PDF/Excel report generation
                                • Full JWT authentication + role-based access
                                """)
                        .contact(new Contact()
                                .name("Saker GeoLab Development Team")
                                .email("dev@sakergeolab.com")
                                .url("https://sakergeolab.com"))
                        .license(new License()
                                .name("Internal Use Only - Saker GeoLab")
                                .url("https://sakergeolab.com")));
    }
}

