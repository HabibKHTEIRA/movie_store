package com.cinestore.service;

import com.cinestore.dto.MovieDetailDto;
import com.cinestore.dto.MovieEventDto;
import com.cinestore.entity.Movie;
import com.cinestore.entity.Review;
import com.cinestore.repository.MovieRepository;
import com.cinestore.repository.PurchaseRepository;
import com.cinestore.repository.ReviewRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Service
public class MovieService {

    private final MovieRepository movieRepository;
    private final PurchaseRepository purchaseRepository;
    private final ReviewRepository reviewRepository;
    private final NotificationService notificationService;

    public MovieService(MovieRepository movieRepository,
                        PurchaseRepository purchaseRepository,
                        ReviewRepository reviewRepository,
                        NotificationService notificationService) {
        this.movieRepository = movieRepository;
        this.purchaseRepository = purchaseRepository;
        this.reviewRepository = reviewRepository;
        this.notificationService = notificationService;
    }

    public Page<Movie> getMovies(String search, String genre, Integer year, Double minRating,
                                 BigDecimal minPrice, BigDecimal maxPrice, boolean inStockOnly,
                                 Pageable pageable) {
        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        String cleanGenre = (genre != null && !genre.trim().isEmpty() && !genre.equalsIgnoreCase("all")) ? genre.trim() : null;
        return movieRepository.findWithFilters(cleanSearch, cleanGenre, year, minRating, minPrice, maxPrice, inStockOnly, pageable);
    }

    public Optional<Movie> getMovieById(Long id) {
        return movieRepository.findById(id);
    }

    public MovieDetailDto getMovieDetail(Long id, String clientIp, String clientSessionId) {
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Film introuvable avec l'ID " + id));

        boolean hasPurchased = purchaseRepository.hasClientPurchasedMovie(id, clientIp, clientSessionId);
        boolean hasReviewed = reviewRepository.hasClientReviewedMovie(id, clientIp, clientSessionId);
        List<Review> reviews = reviewRepository.findByMovieIdOrderByCreatedAtDesc(id);
        Double avgRating = reviewRepository.getAverageRatingForMovie(id);
        long reviewCount = reviewRepository.countByMovieId(id);

        return MovieDetailDto.fromMovie(movie, avgRating != null ? avgRating : 0.0, reviewCount, hasPurchased, hasReviewed, reviews);
    }

    public List<Integer> getAllYears() {
        return movieRepository.findDistinctYears();
    }

    public List<String> getAllGenres() {
        Set<String> uniqueGenres = new TreeSet<>();
        List<String> rawGenreLists = movieRepository.findAllGenresStrings();
        for (String gList : rawGenreLists) {
            if (gList != null) {
                String[] parts = gList.split(",");
                for (String p : parts) {
                    String trimmed = p.trim();
                    if (!trimmed.isEmpty() && !trimmed.equals("\\N")) {
                        uniqueGenres.add(trimmed);
                    }
                }
            }
        }
        return new ArrayList<>(uniqueGenres);
    }

    @Transactional
    public Movie updateMovie(Long id, Movie movieData) {
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Film introuvable avec l'ID " + id));

        boolean priceChanged = !movie.getPrice().equals(movieData.getPrice());
        boolean stockChanged = movie.getCopies() != movieData.getCopies();

        movie.setTitle(movieData.getTitle());
        movie.setYear(movieData.getYear());
        movie.setGenres(movieData.getGenres());
        movie.setPrice(movieData.getPrice());
        movie.setCopies(movieData.getCopies());
        if (movieData.getPosterPath() != null) {
            movie.setPosterPath(movieData.getPosterPath());
        }
        if (movieData.getDescription() != null) {
            movie.setDescription(movieData.getDescription());
        }

        Movie saved = movieRepository.save(movie);

        // Diffusion temps réel
        if (priceChanged || stockChanged) {
            String type = priceChanged && stockChanged ? "FULL_UPDATE" : (priceChanged ? "PRICE_CHANGED" : "STOCK_CHANGED");
            String msg = String.format("Mise à jour pour '%s' : Prix = %.2f€, Copies restantes = %d",
                    saved.getTitle(), saved.getPrice(), saved.getCopies());
            notificationService.broadcastMovieEvent(new MovieEventDto(
                    type, saved.getId(), saved.getTitle(), saved.getPrice(), saved.getCopies(), msg
            ));
        }

        return saved;
    }

    @Transactional
    public Movie createMovie(Movie movie) {
        if (movie.getImdbId() == null || movie.getImdbId().isEmpty()) {
            movie.setImdbId("tt" + System.currentTimeMillis());
        }
        Movie saved = movieRepository.save(movie);

        notificationService.broadcastMovieEvent(new MovieEventDto(
                "NEW_MOVIE", saved.getId(), saved.getTitle(), saved.getPrice(), saved.getCopies(),
                "Nouveau film ajouté au catalogue : " + saved.getTitle()
        ));

        return saved;
    }

    @Transactional
    public void deleteMovie(Long id) {
        movieRepository.deleteById(id);
    }
}
