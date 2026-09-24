package com.cinestore.repository;

import com.cinestore.entity.Movie;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface MovieRepository extends JpaRepository<Movie, Long> {

    Optional<Movie> findByImdbId(String imdbId);

    boolean existsByImdbId(String imdbId);

    // Verrou pessimiste pour garantir qu'aucune transaction concurrente ne lit une valeur obsolète
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT m FROM Movie m WHERE m.id = :id")
    Optional<Movie> findByIdWithPessimisticLock(@Param("id") Long id);

    // Décrémentation ATOMIQUE absolue au niveau du SGBD :
    // Retourne 1 si décrémenté, 0 si stock insuffisant (< qty)
    @Modifying
    @Query("UPDATE Movie m SET m.copies = m.copies - :qty WHERE m.id = :id AND m.copies >= :qty")
    int decrementCopiesAtomically(@Param("id") Long id, @Param("qty") int qty);

    // Incrémentation ATOMIQUE absolue au niveau du SGBD (remise en stock) :
    @Modifying
    @Query("UPDATE Movie m SET m.copies = m.copies + :qty WHERE m.id = :id")
    int incrementCopiesAtomically(@Param("id") Long id, @Param("qty") int qty);

    // Recherche multi-critères : titre, genre, année exacte, note min, prix min/max, en stock
    @Query("SELECT m FROM Movie m WHERE " +
           "(CAST(:search AS string) IS NULL OR LOWER(m.title) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR LOWER(m.genres) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))) AND " +
           "(CAST(:genre AS string) IS NULL OR LOWER(m.genres) LIKE LOWER(CONCAT('%', CAST(:genre AS string), '%'))) AND " +
           "(:year IS NULL OR m.year = :year) AND " +
           "(:minRating IS NULL OR m.rating >= :minRating) AND " +
           "(:minPrice IS NULL OR m.price >= :minPrice) AND " +
           "(:maxPrice IS NULL OR m.price <= :maxPrice) AND " +
           "(:inStockOnly = FALSE OR m.copies > 0)")
    Page<Movie> findWithFilters(
            @Param("search") String search,
            @Param("genre") String genre,
            @Param("year") Integer year,
            @Param("minRating") Double minRating,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            @Param("inStockOnly") boolean inStockOnly,
            Pageable pageable
    );

    // Liste des années uniques disponibles triées de la plus récente à la plus ancienne
    @Query("SELECT DISTINCT m.year FROM Movie m ORDER BY m.year DESC")
    List<Integer> findDistinctYears();

    // Liste des genres uniques disponibles
    @Query("SELECT DISTINCT m.genres FROM Movie m")
    List<String> findAllGenresStrings();
}
