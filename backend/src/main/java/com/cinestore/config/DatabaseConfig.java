package com.cinestore.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;

@Configuration
public class DatabaseConfig {

    private static final Logger log = LoggerFactory.getLogger(DatabaseConfig.class);

    @Bean
    @Primary
    public DataSource dataSource(DataSourceProperties properties) {
        String databaseUrl = System.getenv("DATABASE_URL");
        String springDatasourceUrl = System.getenv("SPRING_DATASOURCE_URL");

        if ((springDatasourceUrl == null || springDatasourceUrl.isBlank()) &&
            databaseUrl != null && (databaseUrl.startsWith("postgres://") || databaseUrl.startsWith("postgresql://"))) {
            try {
                URI uri = new URI(databaseUrl);
                String host = uri.getHost();
                int port = uri.getPort() == -1 ? 5432 : uri.getPort();
                String path = uri.getPath(); // "/nom_base"
                String jdbcUrl = "jdbc:postgresql://" + host + ":" + port + path;
                if (uri.getQuery() != null && !uri.getQuery().isBlank()) {
                    jdbcUrl += "?" + uri.getQuery();
                }

                String username = properties.getUsername();
                String password = properties.getPassword();
                if (uri.getUserInfo() != null) {
                    String[] userInfo = uri.getUserInfo().split(":", 2);
                    username = userInfo[0];
                    if (userInfo.length > 1) {
                        password = userInfo[1];
                    }
                }

                log.info("✅ Connexion PostgreSQL initialisée via DATABASE_URL vers {}:{}", host, port);
                return DataSourceBuilder.create()
                        .url(jdbcUrl)
                        .driverClassName("org.postgresql.Driver")
                        .username(username)
                        .password(password)
                        .build();
            } catch (Exception e) {
                log.warn("Impossible de convertir DATABASE_URL : {}. Utilisation des propriétés par défaut.", e.getMessage());
            }
        }

        return properties.initializeDataSourceBuilder().build();
    }
}
