package com.cinestore.repository;

import com.cinestore.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByMovieIdOrderByCreatedAtDesc(Long movieId);

    @Query("SELECT CASE WHEN COUNT(r) > 0 THEN TRUE ELSE FALSE END FROM Review r " +
           "WHERE r.movieId = :movieId AND ((:sessionId IS NOT NULL AND r.clientSessionId = :sessionId) OR (:clientIp IS NOT NULL AND r.clientIp = :clientIp))")
    boolean hasClientReviewedMovie(@Param("movieId") Long movieId, @Param("clientIp") String clientIp, @Param("sessionId") String sessionId);

    @Query("SELECT COALESCE(AVG(r.rating), 0.0) FROM Review r WHERE r.movieId = :movieId")
    Double getAverageRatingForMovie(@Param("movieId") Long movieId);

    long countByMovieId(Long movieId);
}
