# 🎬 CinéStore - Movie Store

Application e-commerce cinématique moderne et complète permettant la consultation, la recherche, l'achat de films et la gestion de stock en temps réel.

---

## 📑 Sommaire
- [1. Lancement Rapide en Local](#1-lancement-rapide-en-local)
- [2. Informations Techniques : Backend](#2-informations-techniques--backend)
- [3. Informations Techniques : Base de Données](#3-informations-techniques--base-de-données)
- [4. Propositions de Déploiement en Production](#4-propositions-de-déploiement-en-production)
  - [Pourquoi faire évoluer la base de données en production ?](#-pourquoi-faire-évoluer-la-base-de-données-en-production-)
  - [Option 1 : Déploiement Cloud PaaS Managé (Recommandé)](#option-1--déploiement-cloud-paas-managé-recommandé)
  - [Option 2 : Déploiement Conteneurisé avec Docker & Docker Compose](#option-2--déploiement-conteneurisé-avec-docker--docker-compose)
  - [Checklist Sécurité & Bonnes Pratiques](#-checklist-sécurité--bonnes-pratiques-pour-la-production)
- [5. Pages du Site (Captures d'écran)](#5-pages-du-site)

---

## 1. Lancement Rapide en Local

### Prérequis
- **Java 21** (JDK 21)
- **Maven 3.8+**
- **Node.js 18+** & **npm**

### Backend (Spring Boot)

```bash
cd backend
mvn spring-boot:run
```

Le serveur backend démarre sur **`http://localhost:8080`**.

### Frontend (Angular)

```bash
cd frontend
npm install
npm start
```

L'application est accessible sur **`http://localhost:4200`**.

---

## 2. Informations Techniques : Backend

Le backend est développé sous la forme d'une API RESTful couplée à un courtier de messages WebSocket pour la synchronisation du stock en temps réel.

### 🛠️ Stack & Dépendances Clés
- **Framework** : Spring Boot `3.3.4` (Java `21`)
- **Web & REST** : `spring-boot-starter-web`
- **Sécurité** : `spring-boot-starter-security` avec authentification sans état (**Stateless**)
- **Tokens** : JJWT `0.12.6` (`jjwt-api`, `jjwt-impl`, `jjwt-jackson`)
- **Accès aux données** : `spring-boot-starter-data-jpa` (Hibernate ORM)
- **Temps Réel** : `spring-boot-starter-websocket` (Protocole STOMP over WebSocket avec fallback SockJS)
- **Validation** : `spring-boot-starter-validation` (Jakarta Validation)

### 🔌 Endpoints de l'API REST

| Méthode | Endpoint | Description | Accès / Rôle |
|---|---|---|---|
| `GET` | `/api/movies` | Catalogue paginé avec filtres (recherche, genre, note min, tri) | Public |
| `GET` | `/api/movies/{id}` | Détail complet d'un film | Public |
| `GET` | `/api/movies/genres` | Liste des genres disponibles | Public |
| `POST` | `/api/purchases` | Enregistrement d'un achat & décrémentation atomique du stock | Public |
| `GET` | `/api/purchases/my-purchases` | Historique des achats du client (par IP / session) | Public |
| `GET` | `/api/reviews/movie/{movieId}`| Liste des avis d'un film | Public |
| `POST` | `/api/reviews` | Ajout d'un avis client (note 1 à 5 étoiles + commentaire) | Public |
| `POST` | `/api/admin/login` | Authentification admin et génération du token JWT | Public |
| `POST` | `/api/admin/movies` | Ajout d'un nouveau film au catalogue | 🔒 **ADMIN** (Bearer Token) |
| `PUT` | `/api/admin/movies/{id}` | Mise à jour des informations d'un film | 🔒 **ADMIN** (Bearer Token) |
| `DELETE` | `/api/admin/movies/{id}` | Suppression d'un film du catalogue | 🔒 **ADMIN** (Bearer Token) |
| `PATCH` | `/api/admin/movies/{id}/copies` | Réapprovisionnement du stock de copies | 🔒 **ADMIN** (Bearer Token) |

### 🔐 Sécurité & Espace Administration
- **Authentification JWT** : L'accès aux opérations d'administration (`/api/admin/**`) requiert un en-tête HTTP `Authorization: Bearer <token>`.
- **Identifiants Admin par défaut** (configurés dans `backend/src/main/resources/application.yml`) :
  - **Identifiant** : `admin`
  - **Mot de passe** : `1234`
- **Contrôle d'accès** : Les routes de consultation de films, de passage de commande et d'avis sont publiques, permettant un parcours utilisateur fluide.

### ⚡ WebSocket & Synchronisation Temps Réel
- **Point d'entrée STOMP** : `/ws` (avec fallback SockJS pour navigateurs restreints).
- **Canaux de diffusion (Topic)** : `/topic/movies`.
- **Fonctionnement** : Dès qu'une commande est validée ou qu'un administrateur réapprovisionne des copies, un événement `MovieEventDto` est émis en WebSocket vers tous les clients connectés pour rafraîchir dynamiquement le stock sans rechargement de page.

### 📦 Initialisation Automatique des Données (`DataInitializer`)
- Au démarrage (`ApplicationReadyEvent`), si la base de données est vide, le composant `DataInitializer` charge automatiquement le fichier `data/movies_seed.json`.
- Un dédoublonnage strict par identifiant IMDb (`imdbId`) est appliqué afin de garantir l'intégrité du catalogue.

---

## 3. Informations Techniques : Base de Données

### 💾 Moteur de Base de Données (Environnement Local)
Pour le développement local, le projet utilise **H2 Database** configuré en mode **fichier persistant**. Les données (achats, avis, modifications de stock) sont conservées même après redémarrage du backend.

- **Fichier de stockage** : Stocké localement dans `./data/movies_db.mv.db` (dossier `backend/data/`).
- **Chaîne de connexion JDBC** : `jdbc:h2:file:./data/movies_db;AUTO_SERVER=TRUE`
- **Dialecte Hibernate** : `org.hibernate.dialect.H2Dialect`
- **Gestion du schéma** : `spring.jpa.hibernate.ddl-auto: update` (génération et mise à jour automatique des tables).

### 🖥️ Console Web H2 (Interface Graphique)
Une console web intégrée permet d'explorer et d'exécuter des requêtes SQL directement :
- **URL** : `http://localhost:8080/h2-console`
- **Driver Class** : `org.h2.Driver`
- **JDBC URL** : `jdbc:h2:file:./data/movies_db`
- **Nom d'utilisateur (User)** : `sa`
- **Mot de passe (Password)** : *(laisser vide)*

### 📐 Modèle Relationnel & Entités JPA

```
┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│              Movie              │       │            Purchase             │
├─────────────────────────────────┤       ├─────────────────────────────────┤
│ id : Long (PK, AUTO)            │       │ id : Long (PK, AUTO)            │
│ imdbId : String (UNIQUE, INDEX) │       │ movieId : Long (INDEX)          │
│ title : String                  │       │ movieTitle : String             │
│ release_year : int (INDEX)      │       │ quantity : int                  │
│ genres : String                 │       │ pricePaid : BigDecimal          │
│ runtime : int                   │       │ clientIp : String (INDEX)       │
│ rating : double (INDEX)         │       │ clientSessionId : String (INDEX)│
│ numVotes : long                 │       │ purchaseDate : LocalDateTime    │
│ price : BigDecimal              │       └─────────────────────────────────┘
│ copies : int                    │
│ posterPath : String             │       ┌─────────────────────────────────┐
│ description : String            │       │             Review              │
│ version : Long (@Version)       │       ├─────────────────────────────────┤
└─────────────────────────────────┘       │ id : Long (PK, AUTO)            │
                                          │ movieId : Long (INDEX)          │
                                          │ clientIp : String (INDEX)       │
                                          │ clientSessionId : String (INDEX)│
                                          │ authorName : String             │
                                          │ rating : int (1 à 5)            │
                                          │ comment : String                │
                                          │ createdAt : LocalDateTime       │
                                          └─────────────────────────────────┘
```

#### Points remarquables du modèle :
1. **Gestion de la concurrence (Optimistic Locking)** : L'entité `Movie` intègre un champ `@Version private Long version;`. Cela garantit l'intégrité du stock de copies lors d'achats simultanés en empêchant tout écrasement concurrentiel (*Lost Update*).
2. **Indexation de performance** : Des index JPA sont déclarés sur `imdbId`, `release_year`, `rating` (pour les filtres et tris rapides) ainsi que sur `movieId`, `clientIp` et `clientSessionId` (pour restituer l'historique et les avis d'un client).

---

## 4. Propositions de Déploiement en Production

### ⚠️ Pourquoi faire évoluer la base de données en production ?
Bien que **H2** soit idéal pour le développement local :
- **Système de fichiers éphémère** : Les hébergeurs Cloud modernes (Render, Railway, Heroku, conteneurs Docker stateless) réinitialisent le disque local à chaque déploiement ou redémarrage. Un fichier H2 local serait donc perdu.
- **Concurrence & scalabilité** : H2 en mode fichier n'est pas conçu pour supporter un trafic important de production ni une montée en charge multi-instances.

> [!IMPORTANT]
> Pour un environnement de production stable et persistant, il est fortement recommandé de basculer vers **PostgreSQL** (ou MySQL/MariaDB). Spring Boot et Hibernate gèrent cette transition sans changer le code Java.

---

### Option 1 : Déploiement Cloud PaaS Managé — Northflank & Vercel (Hautement Recommandé)
Pour un portfolio destiné aux recruteurs, **[Northflank](https://northflank.com)** (plan *Developer Sandbox* gratuit) est actuellement la solution la plus adaptée :
- ⚡ **Compute "Always-On" sans mise en veille** : Contrairement à Render ou Koyeb (qui s'endorment après 15 min à 1h d'inactivité et imposent 30 à 60 secondes de "cold start"), Northflank maintient votre conteneur actif 24h/24. Un recruteur qui clique sur votre site obtient une réponse immédiate.
- 🗄️ **Base PostgreSQL Managée gratuite & persistante** : Directement intégrée sous forme d'Addon.
- 💰 **Coût : 0 €** (Le plan Developer Sandbox offre 2 services gratuits + 1 base de données gratuite).

```
┌─────────────────────────────────┐
│     Frontend Angular (Vercel)   │
│   https://votre-app.vercel.app  │
└────────────────┬────────────────┘
                 │ HTTPS / WSS / SSE
                 ▼
┌─────────────────────────────────┐
│  Backend Spring Boot (Java 21)  │
│   Northflank Developer Sandbox  │
│      (Always-On, sans veille)   │
└────────────────┬────────────────┘
                 │ Connexion PostgreSQL
                 ▼
┌─────────────────────────────────┐
│    PostgreSQL Addon Managé      │
│      (Northflank persistent)    │
└─────────────────────────────────┘
```

#### Étape 1 : Créer la Base de Données PostgreSQL sur Northflank
1. Rendez-vous sur votre tableau de bord **Northflank** et créez un projet (ex: `cinestore`, région recommandée : `Europe West`).
2. Cliquez sur **Create New** → **Addon** → choisissez **PostgreSQL** (version 16).
3. Northflank provisionne la base et fournit les informations de connexion : `HOST`, `PORT`, `DATABASE`, `USERNAME`, `PASSWORD` ainsi que la variable `DATABASE_URL`.

#### Étape 2 : Déployer le Backend Spring Boot sur Northflank
1. Cliquez sur **Create New** → **Service** → **Combined Service**.
2. Liez votre dépôt **GitHub**.
3. Dans la section **Build configuration** :
   - Build type : **Dockerfile**
   - Build context : `backend`
   - Dockerfile path : `Dockerfile` (ou `backend/Dockerfile` si le context est à la racine)
4. Dans la section **Networking** :
   - Port : `8080`
   - Protocol : `HTTP`
   - Public access : **Activé**
5. Dans la section **Environment Variables**, ajoutez :
   ```env
   SPRING_DATASOURCE_URL=jdbc:postgresql://${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DATABASE}?sslmode=require
   SPRING_DATASOURCE_USERNAME=${POSTGRES_USERNAME}
   SPRING_DATASOURCE_PASSWORD=${POSTGRES_PASSWORD}
   SPRING_JPA_HIBERNATE_DDL_AUTO=update
   SPRING_H2_CONSOLE_ENABLED=false
   APP_JWT_SECRET=<votre_chaine_secrete_aleatoire_de_64_caracteres_min>
   APP_ADMIN_USERNAME=<votre_identifiant_admin_personnalise>
   APP_ADMIN_PASSWORD=<votre_mot_de_passe_admin_securise>
   APP_CORS_ALLOWED_ORIGINS=https://votre-app.vercel.app
   ```
   *(Note : Grâce à la classe `DatabaseConfig` intégrée au projet, si Northflank injecte directement `DATABASE_URL`, l'URL PostgreSQL est automatiquement convertie au format JDBC).*
6. Cliquez sur **Deploy Service**. Northflank va builder le conteneur multi-stage et vous attribuer une URL publique (ex: `https://cinestore-backend--votre-compte.northflank.app`).

#### Étape 3 : Déployer le Frontend Angular sur Vercel
1. Renseignez l'URL de votre backend Northflank dans [environment.prod.ts](file:///home/habib/Bureau/movies_store/frontend/src/environments/environment.prod.ts) :
   ```typescript
   export const environment = {
     production: true,
     apiUrl: 'https://cinestore-backend--votre-compte.northflank.app/api'
   };
   ```
2. Importez votre dépôt GitHub sur **Vercel** (la configuration de build est déjà prête dans [vercel.json](file:///home/habib/Bureau/movies_store/vercel.json)).
3. Vercel compile et déploie le site Angular instantanément avec HTTPS natif.

---

### Option 2 : Déploiement Conteneurisé avec Docker & Docker Compose
Idéal pour héberger l'ensemble de la pile sur un serveur VPS (ex: OVH, Hetzner, DigitalOcean) ou une infrastructure privée.

#### 1. Fichier `backend/Dockerfile`
Créer un fichier `Dockerfile` dans le dossier `backend/` (Multi-stage build léger avec Java 21) :

```dockerfile
# Étape 1 : Build de l'application
FROM maven:3.9.6-eclipse-temurin-21-alpine AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests

# Étape 2 : Image d'exécution minimale
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

#### 2. Fichier `docker-compose.yml` (à la racine du projet)

```yaml
version: '3.8'

services:
  # Base de données PostgreSQL persistante
  postgres-db:
    image: postgres:16-alpine
    container_name: cinestore-db
    restart: always
    environment:
      POSTGRES_DB: cinestore
      POSTGRES_USER: cinestore_user
      POSTGRES_PASSWORD: StrongProductionPassword2026!
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - cinestore-network

  # Backend Spring Boot
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: cinestore-backend
    restart: always
    depends_on:
      - postgres-db
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres-db:5432/cinestore
      SPRING_DATASOURCE_USERNAME: cinestore_user
      SPRING_DATASOURCE_PASSWORD: StrongProductionPassword2026!
      SPRING_JPA_DATABASE_PLATFORM: org.hibernate.dialect.PostgreSQLDialect
      SPRING_JPA_HIBERNATE_DDL_AUTO: update
      APP_JWT_SECRET: "CineStoreSuperSecretProductionSecurityKey2026WithSufficientBits"
      APP_ADMIN_USERNAME: "admin"
      APP_ADMIN_PASSWORD: "SuperSecureAdminPassword!"
    ports:
      - "8080:8080"
    networks:
      - cinestore-network

volumes:
  postgres_data:
    driver: local

networks:
  cinestore-network:
    driver: bridge
```

#### Lancement de la pile :
```bash
docker compose up -d --build
```

---

### 🛡️ Checklist Sécurité & Bonnes Pratiques pour la Production

1. **Restriction CORS** : Dans `backend/src/main/java/com/cinestore/config/SecurityConfig.java`, remplacer `allowedOriginPatterns("*")` par le nom de domaine exact du frontend déployé (ex: `https://mon-cinestore.vercel.app`).
2. **Secret JWT** : Générer une clé secrète aléatoire de 256 bits minimum et l'injecter exclusivement via variable d'environnement (`APP_JWT_SECRET`).
3. **Mots de passe Administrateur** : Ne jamais conserver les identifiants par défaut (`admin` / `1234`) en production.
4. **Désactivation de la console H2** : S'assurer que `spring.h2.console.enabled` est désactivé (`false`) lors du passage sur PostgreSQL.
5. **Sauvegardes de la base** : Automatiser des sauvegardes régulières avec `pg_dump` ou les snapshots natifs de votre hébergeur.

---

## 5. Pages du Site

### Page d'Accueil

![Page d'Accueil](Img/Accueil.png)

### Détail d'un Film

![Détail d'un Film](Img/Detail.png)

### Panier

![Panier](Img/Panier.png)

### Validation de la Commande

![Validation de la Commande](Img/Validation.png)

### Mes Achats

![Mes Achats](Img/MesAchats.png)

### Connexion Administrateur

![Connexion Administrateur](Img/Login_admin.png)

### Panneau d'Administration

![Panneau d'Administration](Img/Pannel_admin.png)
