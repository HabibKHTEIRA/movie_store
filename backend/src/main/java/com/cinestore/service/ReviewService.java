package com.cinestore.service;

import com.cinestore.dto.ReviewRequest;
import com.cinestore.entity.Movie;
import com.cinestore.entity.Review;
import com.cinestore.repository.MovieRepository;
import com.cinestore.repository.PurchaseRepository;
import com.cinestore.repository.ReviewRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final PurchaseRepository purchaseRepository;
    private final MovieRepository movieRepository;

    public ReviewService(ReviewRepository reviewRepository,
                         PurchaseRepository purchaseRepository,
                         MovieRepository movieRepository) {
        this.reviewRepository = reviewRepository;
        this.purchaseRepository = purchaseRepository;
        this.movieRepository = movieRepository;
    }

    public List<Review> getReviewsForMovie(Long movieId) {
        return reviewRepository.findByMovieIdOrderByCreatedAtDesc(movieId);
    }

    @Transactional
    public Review addReview(Long movieId, ReviewRequest request, String clientIp, String clientSessionId) {
        Movie movie = movieRepository.findById(movieId)
                .orElseThrow(() -> new NoSuchElementException("Film introuvable avec l'ID " + movieId));

        // 1. Contrôle anti-bot / anti-spam : Vérifier que le client a bien acheté le film
        boolean hasPurchased = purchaseRepository.hasClientPurchasedMovie(movieId, clientIp, clientSessionId);
        if (!hasPurchased) {
            throw new SecurityException("Accès refusé : Seuls les utilisateurs ayant acheté ce film peuvent laisser une note et un commentaire.");
        }

        // 2. Contrôle d'unicité : 1 seul avis par acheteur pour ce film
        boolean hasAlreadyReviewed = reviewRepository.hasClientReviewedMovie(movieId, clientIp, clientSessionId);
        if (hasAlreadyReviewed) {
            throw new IllegalStateException("Conflit : Vous avez déjà soumis une évaluation pour ce film.");
        }

        // 3. Enregistrement de l'avis
        String author = (request.getAuthorName() != null && !request.getAuthorName().trim().isEmpty())
                ? request.getAuthorName().trim()
                : "Acheteur Vérifié";

        Review review = new Review(
                movieId,
                clientIp != null ? clientIp : "127.0.0.1",
                clientSessionId,
                author,
                request.getRating(),
                request.getComment().trim()
        );

        return reviewRepository.save(review);
    }
}
