FROM eclipse-temurin:21-jre-alpine AS runtime
WORKDIR /app
RUN addgroup -S geotech && adduser -S geotech -G geotech
COPY target/report-service-*.jar app.jar
USER geotech
EXPOSE 8090
ENTRYPOINT ["java", "-jar", "app.jar"]
