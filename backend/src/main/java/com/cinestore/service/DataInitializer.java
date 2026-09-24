package com.cinestore.service;

import com.cinestore.entity.Movie;
import com.cinestore.repository.MovieRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.util.*;

@Component
public class DataInitializer {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final MovieRepository movieRepository;
    private final ObjectMapper objectMapper;

    public DataInitializer(MovieRepository movieRepository, ObjectMapper objectMapper) {
        this.movieRepository = movieRepository;
        this.objectMapper = objectMapper;
    }

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void seedInitialData() {
        // 1. Nettoyage préventif des doublons éventuels
        cleanupDuplicates();

        log.info("Vérification et chargement des films IMDb/TMDB dans la base de données...");
        try {
            ClassPathResource resource = new ClassPathResource("data/movies_seed.json");
            if (!resource.exists()) {
                log.warn("Fichier de seed introuvable : data/movies_seed.json");
                return;
            }

            try (InputStream is = resource.getInputStream()) {
                List<Movie> movies = objectMapper.readValue(is, new TypeReference<List<Movie>>() {});
                // Dédoublonnage strict par imdbId
                Map<String, Movie> uniqueMovies = new LinkedHashMap<>();
                for (Movie m : movies) {
                    if (m.getImdbId() != null && !uniqueMovies.containsKey(m.getImdbId())) {
                        uniqueMovies.put(m.getImdbId(), m);
                    }
                }

                // Insertion uniquement des films du seed non encore présents
                List<Movie> missingMovies = new ArrayList<>();
                for (Movie m : uniqueMovies.values()) {
                    if (!movieRepository.existsByImdbId(m.getImdbId())) {
                        missingMovies.add(m);
                    }
                }

                if (!missingMovies.isEmpty()) {
                    movieRepository.saveAll(missingMovies);
                    log.info("✅ Initialisation réussie : {} nouveaux films uniques chargés en base (Total: {}).",
                            missingMovies.size(), movieRepository.count());
                } else {
                    log.info("Base de données CinéStore active et complète ({} films uniques présents).", movieRepository.count());
                }
            }
        } catch (Exception e) {
            log.error("Erreur lors du chargement des films initiaux : {}", e.getMessage(), e);
        }
    }

    private void cleanupDuplicates() {
        try {
            List<Movie> allMovies = movieRepository.findAll();
            Set<String> seenImdbIds = new HashSet<>();
            List<Movie> toDelete = new ArrayList<>();

            for (Movie m : allMovies) {
                if (m.getImdbId() != null) {
                    if (seenImdbIds.contains(m.getImdbId())) {
                        toDelete.add(m);
                    } else {
                        seenImdbIds.add(m.getImdbId());
                    }
                }
            }

            if (!toDelete.isEmpty()) {
                log.warn("Suppression de {} film(s) dupliqué(s) dans la base de données...", toDelete.size());
                movieRepository.deleteAll(toDelete);
                log.info("✅ Nettoyage des doublons terminé avec succès.");
            }
        } catch (Exception e) {
            log.warn("Vérification des doublons : {}", e.getMessage());
        }
    }
}
