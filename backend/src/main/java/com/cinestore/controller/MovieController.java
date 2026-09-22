package com.cinestore.controller;

import com.cinestore.dto.MovieDetailDto;
import com.cinestore.entity.Movie;
import com.cinestore.service.MovieService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/movies")
public class MovieController {

    private final MovieService movieService;

    public MovieController(MovieService movieService) {
        this.movieService = movieService;
    }

    @GetMapping
    public ResponseEntity<Page<Movie>> getMovies(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String genre,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Double minRating,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(defaultValue = "false") boolean inStockOnly,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "popularity") String sort
    ) {
        Sort sortSpec;
        switch (sort.toLowerCase()) {
            case "price_asc":
                sortSpec = Sort.by(Sort.Direction.ASC, "price");
                break;
            case "price_desc":
                sortSpec = Sort.by(Sort.Direction.DESC, "price");
                break;
            case "rating":
                sortSpec = Sort.by(Sort.Direction.DESC, "rating").and(Sort.by(Sort.Direction.DESC, "numVotes"));
                break;
            case "year_desc":
                sortSpec = Sort.by(Sort.Direction.DESC, "year");
                break;
            case "year_asc":
                sortSpec = Sort.by(Sort.Direction.ASC, "year");
                break;
            case "title_asc":
                sortSpec = Sort.by(Sort.Direction.ASC, "title");
                break;
            case "popularity":
            default:
                sortSpec = Sort.by(Sort.Direction.DESC, "numVotes").and(Sort.by(Sort.Direction.DESC, "rating"));
                break;
        }

        Pageable pageable = PageRequest.of(page, size, sortSpec);
        return ResponseEntity.ok(movieService.getMovies(search, genre, year, minRating, minPrice, maxPrice, inStockOnly, pageable));
    }

    @GetMapping("/years")
    public ResponseEntity<List<Integer>> getYears() {
        return ResponseEntity.ok(movieService.getAllYears());
    }

    @GetMapping("/genres")
    public ResponseEntity<List<String>> getGenres() {
        return ResponseEntity.ok(movieService.getAllGenres());
    }

    @GetMapping("/{id:[0-9]+}")
    public ResponseEntity<MovieDetailDto> getMovieDetail(
            @PathVariable Long id,
            @RequestHeader(value = "X-Client-Id", required = false) String clientId,
            HttpServletRequest request
    ) {
        String clientIp = extractClientIp(request);
        return ResponseEntity.ok(movieService.getMovieDetail(id, clientIp, clientId));
    }

    private String extractClientIp(HttpServletRequest request) {
        String xForwarded = request.getHeader("X-Forwarded-For");
        if (xForwarded != null && !xForwarded.isEmpty() && !"unknown".equalsIgnoreCase(xForwarded)) {
            return xForwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
