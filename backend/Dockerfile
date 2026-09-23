# =============================================================================
# Étape 1 : Construction de l'artefact JAR avec Maven et OpenJDK 21
# =============================================================================
FROM maven:3.9.6-eclipse-temurin-21-alpine AS build
WORKDIR /app

# Mise en cache optimale des dépendances Maven
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Compilation et packaging de l'application Spring Boot
COPY src ./src
RUN mvn clean package -DskipTests

# =============================================================================
# Étape 2 : Image d'exécution minimale ultra-légère (JRE 21 Alpine)
# =============================================================================
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Création d'un utilisateur non-root pour des raisons de sécurité
RUN addgroup -S cinestore && adduser -S cinestore -G cinestore
USER cinestore:cinestore

# Copie du jar généré depuis l'étape de build
COPY --from=build /app/target/*.jar app.jar

# Configuration du port dynamique pour Northflank / Cloud (défaut 8080)
ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
