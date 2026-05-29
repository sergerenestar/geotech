FROM eclipse-temurin:21-jre-alpine AS runtime
WORKDIR /app
RUN addgroup -S geotech && adduser -S geotech -G geotech
COPY target/project-service-*.jar app.jar
USER geotech
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]
