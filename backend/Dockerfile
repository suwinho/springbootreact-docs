FROM maven:3.9.6-eclipse-temurin-21 AS deps
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline

FROM deps AS build
COPY src ./src
RUN mvn clean package -DskipTests

FROM eclipse-temurin:21-jre-alpine AS production
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=build /app/target/*.jar app.jar

USER appuser
EXPOSE 8081

ENTRYPOINT ["java", "-jar", "app.jar"]