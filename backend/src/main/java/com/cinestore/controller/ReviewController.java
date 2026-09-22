package com.cinestore.controller;

import com.cinestore.dto.ReviewRequest;
import com.cinestore.entity.Review;
import com.cinestore.service.ReviewService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping("/movie/{movieId}")
    public ResponseEntity<List<Review>> getReviews(@PathVariable Long movieId) {
        return ResponseEntity.ok(reviewService.getReviewsForMovie(movieId));
    }

    @PostMapping("/movie/{movieId}")
    public ResponseEntity<?> addReview(
            @PathVariable Long movieId,
            @Valid @RequestBody ReviewRequest reviewRequest,
            @RequestHeader(value = "X-Client-Id", required = false) String clientId,
            HttpServletRequest request
    ) {
        String clientIp = extractClientIp(request);
        try {
            Review review = reviewService.addReview(movieId, reviewRequest, clientIp, clientId);
            return ResponseEntity.status(HttpStatus.CREATED).body(review);
        } catch (SecurityException e) {
            // Non acheté
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "error", "PURCHASE_REQUIRED",
                    "message", e.getMessage()
            ));
        } catch (IllegalStateException e) {
            // Déjà noté
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                    "error", "ALREADY_REVIEWED",
                    "message", e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "error", "BAD_REQUEST",
                    "message", e.getMessage()
            ));
        }
    }

    private String extractClientIp(HttpServletRequest request) {
        String xForwarded = request.getHeader("X-Forwarded-For");
        if (xForwarded != null && !xForwarded.isEmpty() && !"unknown".equalsIgnoreCase(xForwarded)) {
            return xForwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
