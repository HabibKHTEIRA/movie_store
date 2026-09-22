package com.cinestore.repository;

import com.cinestore.entity.Purchase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface PurchaseRepository extends JpaRepository<Purchase, Long> {

    boolean existsByMovieIdAndClientIp(Long movieId, String clientIp);

    boolean existsByMovieIdAndClientSessionId(Long movieId, String clientSessionId);

    List<Purchase> findByMovieIdAndClientSessionId(Long movieId, String clientSessionId);

    @Query("SELECT CASE WHEN COUNT(p) > 0 THEN TRUE ELSE FALSE END FROM Purchase p " +
           "WHERE p.movieId = :movieId AND ((:sessionId IS NOT NULL AND p.clientSessionId = :sessionId) OR (:clientIp IS NOT NULL AND p.clientIp = :clientIp))")
    boolean hasClientPurchasedMovie(@Param("movieId") Long movieId, @Param("clientIp") String clientIp, @Param("sessionId") String sessionId);

    @Query("SELECT p FROM Purchase p WHERE (:sessionId IS NOT NULL AND p.clientSessionId = :sessionId) OR (:clientIp IS NOT NULL AND p.clientIp = :clientIp) ORDER BY p.purchaseDate DESC")
    List<Purchase> findPurchasesByClient(@Param("clientIp") String clientIp, @Param("sessionId") String sessionId);

    @Query("SELECT COALESCE(SUM(p.pricePaid), 0) FROM Purchase p")
    BigDecimal sumTotalRevenue();
}
