package com.cinestore.controller;

import com.cinestore.config.JwtUtil;
import com.cinestore.dto.AuthResponse;
import com.cinestore.dto.LoginRequest;
import com.cinestore.entity.Movie;
import com.cinestore.service.MovieService;
import com.cinestore.service.PurchaseService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final MovieService movieService;
    private final PurchaseService purchaseService;
    private final JwtUtil jwtUtil;

    @Value("${app.admin.username}")
    private String adminUsername;

    @Value("${app.admin.password}")
    private String adminPassword;

    public AdminController(MovieService movieService,
                           PurchaseService purchaseService,
                           JwtUtil jwtUtil) {
        this.movieService = movieService;
        this.purchaseService = purchaseService;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        if (adminUsername.equals(loginRequest.getUsername()) &&
            adminPassword.equals(loginRequest.getPassword())) {

            String token = jwtUtil.generateToken(adminUsername, "ADMIN");
            return ResponseEntity.ok(new AuthResponse(token, adminUsername, "ROLE_ADMIN", 86400000L));
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                "error", "INVALID_CREDENTIALS",
                "message", "Identifiant ou mot de passe incorrect."
        ));
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(purchaseService.getAdminStatistics());
    }

    @GetMapping("/movies")
    public ResponseEntity<Page<Movie>> getAdminMovies(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir
    ) {
        Sort sort = Sort.by(Sort.Direction.DESC, "id");
        if (sortBy != null && !sortBy.trim().isEmpty()) {
            Sort.Direction direction = "desc".equalsIgnoreCase(sortDir) ? Sort.Direction.DESC : Sort.Direction.ASC;
            if ("title".equalsIgnoreCase(sortBy)) {
                sort = Sort.by(direction, "title");
            } else if ("year".equalsIgnoreCase(sortBy)) {
                sort = Sort.by(direction, "year");
            } else if ("rating".equalsIgnoreCase(sortBy)) {
                sort = Sort.by(direction, "rating");
            }
        }
        return ResponseEntity.ok(movieService.getMovies(search, null, null, null, null, null, false,
                PageRequest.of(page, size, sort)));
    }

    @PostMapping("/movies")
    public ResponseEntity<Movie> addMovie(@RequestBody Movie movie) {
        return ResponseEntity.status(HttpStatus.CREATED).body(movieService.createMovie(movie));
    }

    @PutMapping("/movies/{id}")
    public ResponseEntity<Movie> updateMovie(@PathVariable Long id, @RequestBody Movie movie) {
        return ResponseEntity.ok(movieService.updateMovie(id, movie));
    }

    @DeleteMapping("/movies/{id}")
    public ResponseEntity<?> deleteMovie(@PathVariable Long id) {
        movieService.deleteMovie(id);
        return ResponseEntity.ok(Map.of("message", "Film supprimé avec succès."));
    }
}
